import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import CircuitBreaker from 'opossum';

export interface ResilientRpcOptions {
  timeoutMs?: number;
  retries?: number;
  retryDelayMs?: number;
}

const DEFAULTS = {
  timeoutMs: 10_000,
  retries: 2,
  retryDelayMs: 300,
  errorThresholdPercentage: 50,
  resetTimeout: 15_000,
  volumeThreshold: 5,
};

/**
 * Bọc các lời gọi RMQ request-reply của saga bằng:
 *   - Retry (thử lại khi lỗi transient, có backoff tuyến tính)
 *   - Circuit breaker (opossum): nếu một service lỗi liên tục, mở mạch để
 *     fail-fast thay vì treo chờ timeout, tự thử lại (half-open) sau resetTimeout.
 *
 * Mỗi (service pattern) có một breaker riêng, định danh theo key.
 */
@Injectable()
export class ResilientRpcService implements OnModuleDestroy {
  private readonly logger = new Logger(ResilientRpcService.name);
  private readonly breakers = new Map<
    string,
    CircuitBreaker<[ClientProxy, string, unknown, number], unknown>
  >();

  /** Gọi request-reply có retry + circuit breaker. `key` gom nhóm breaker. */
  async send<T>(
    key: string,
    client: ClientProxy,
    pattern: string,
    payload: unknown,
    options: ResilientRpcOptions = {},
  ): Promise<T> {
    const breaker = this.getBreaker(key);
    const timeoutMs = options.timeoutMs ?? DEFAULTS.timeoutMs;
    const retries = options.retries ?? DEFAULTS.retries;
    const retryDelayMs = options.retryDelayMs ?? DEFAULTS.retryDelayMs;

    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return (await breaker.fire(client, pattern, payload, timeoutMs)) as T;
      } catch (err) {
        lastErr = err;
        // Mạch đang mở -> fail-fast, không retry thêm vô ích.
        if (this.isOpenError(err)) {
          this.logger.warn(`Circuit OPEN cho ${key} (${pattern}), fail-fast.`);
          break;
        }
        if (attempt < retries) {
          const delay = retryDelayMs * (attempt + 1);
          this.logger.warn(
            `RPC ${pattern} lỗi (lần ${attempt + 1}/${retries + 1}), ` +
              `thử lại sau ${delay}ms: ${this.errMsg(err)}`,
          );
          await this.sleep(delay);
        }
      }
    }
    throw lastErr;
  }

  private getBreaker(key: string) {
    let breaker = this.breakers.get(key);
    if (breaker) return breaker;

    const action = (
      client: ClientProxy,
      pattern: string,
      payload: unknown,
      timeoutMs: number,
    ) => firstValueFrom(client.send(pattern, payload).pipe(timeout(timeoutMs)));

    breaker = new CircuitBreaker(action, {
      // opossum tự timeout, nhưng ta đã dùng rxjs timeout; tắt timeout của breaker.
      timeout: false,
      errorThresholdPercentage: DEFAULTS.errorThresholdPercentage,
      resetTimeout: DEFAULTS.resetTimeout,
      volumeThreshold: DEFAULTS.volumeThreshold,
      name: key,
    });

    breaker.on('open', () => this.logger.error(`Circuit breaker OPEN: ${key}`));
    breaker.on('halfOpen', () =>
      this.logger.warn(`Circuit breaker HALF-OPEN (thử lại): ${key}`),
    );
    breaker.on('close', () =>
      this.logger.log(`Circuit breaker CLOSE (phục hồi): ${key}`),
    );

    this.breakers.set(key, breaker);
    return breaker;
  }

  onModuleDestroy(): void {
    for (const breaker of this.breakers.values()) {
      breaker.shutdown();
    }
    this.breakers.clear();
  }

  private isOpenError(err: unknown): boolean {
    return (
      !!err &&
      typeof err === 'object' &&
      'code' in err &&
      (err as { code?: string }).code === 'EOPENBREAKER'
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private errMsg(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === 'string') return err;
    try {
      return JSON.stringify(err);
    } catch {
      return 'unknown error';
    }
  }
}
