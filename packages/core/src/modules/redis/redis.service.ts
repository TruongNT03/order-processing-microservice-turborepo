import { Inject, Injectable } from "@nestjs/common";
import { REDIS_PROVIDE } from "./redis.constant";
import Redis from "ioredis";
import { randomUUID } from "crypto";

@Injectable()
export class RedisService {
  constructor(
    @Inject(REDIS_PROVIDE)
    private readonly redis: Redis,
  ) {}

  async setValue<T = any>(key: string, value: T, ttl?: number) {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    if (ttl) {
      await this.redis.set(key, serialized, "EX", ttl);
    } else {
      await this.redis.set(key, serialized);
    }
  }

  async getValue<T = any>(key: string) {
    const value = await this.redis.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch (error) {
      return value as T;
    }
  }

  async deleteByKey(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async deleteByPattern(pattern: string): Promise<void> {
    const keys = await this.redis.keys(pattern);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }

  async acquire(key: string, ttl: number = 10000): Promise<string | null> {
    const token = randomUUID();

    const result = await this.redis.set(`lock:${key}`, token, "PX", ttl, "NX");

    return result === "OK" ? token : null;
  }

  async release(key: string, token: string): Promise<boolean> {
    const script = `
      if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
      end
      return 0
    `;

    const result = await this.redis.eval(script, 1, `lock:${key}`, token);

    return result === 1;
  }
}
