import { registerAs } from "@nestjs/config";

export const redisConfiguration = registerAs("redisConfig", () => ({
  host: process.env.REDIS_HOST || "localhost",
  port: +process.env.REDIS_PORT || 6379,
  url: process.env.REDIS_URL || "localhost:6379",
}));
