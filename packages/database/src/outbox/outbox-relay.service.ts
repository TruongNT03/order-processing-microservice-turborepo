import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from "@nestjs/common";
import { OutboxService } from "./outbox.service";
import { OUTBOX_PUBLISHER, OutboxPublisher } from "./outbox-publisher";

export const OUTBOX_RELAY_OPTIONS = "OUTBOX_RELAY_OPTIONS";

export interface OutboxRelayOptions {
  /** Chu kỳ quét outbox (ms). Mặc định 3000. */
  pollIntervalMs?: number;
  /** Số event lấy mỗi lần quét. Mặc định 50. */
  batchSize?: number;
  /** Số lần thử tối đa trước khi đánh dấu FAILED. Mặc định 5. */
  maxAttempts?: number;
}

/**
 * Transactional Outbox relay.
 *
 * Định kỳ quét các outbox_events ở trạng thái PENDING và publish ra broker
 * qua `OutboxPublisher`. Nhờ đó việc ghi DB (trong transaction nghiệp vụ) và
 * việc phát message được tách rời nhưng vẫn đảm bảo at-least-once: event chỉ
 * được publish sau khi transaction nghiệp vụ commit, và relay sẽ thử lại cho
 * tới khi thành công (hoặc vượt ngưỡng -> FAILED để xử lý thủ công).
 */
@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OutboxRelayService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;
  private stopped = false;

  private readonly pollIntervalMs: number;
  private readonly batchSize: number;
  private readonly maxAttempts: number;

  constructor(
    private readonly outboxService: OutboxService,
    @Optional()
    @Inject(OUTBOX_PUBLISHER)
    private readonly publisher: OutboxPublisher | null,
    @Optional()
    @Inject(OUTBOX_RELAY_OPTIONS)
    options: OutboxRelayOptions | null,
  ) {
    this.pollIntervalMs = options?.pollIntervalMs ?? 3000;
    this.batchSize = options?.batchSize ?? 50;
    this.maxAttempts = options?.maxAttempts ?? 5;
  }

  onModuleInit(): void {
    if (!this.publisher) {
      this.logger.warn(
        "OutboxRelay không có OUTBOX_PUBLISHER -> relay không chạy.",
      );
      return;
    }
    this.schedule();
    this.logger.log(
      `Outbox relay started (interval=${this.pollIntervalMs}ms, batch=${this.batchSize}).`,
    );
  }

  onModuleDestroy(): void {
    this.stopped = true;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  private schedule(): void {
    if (this.stopped) return;
    this.timer = setTimeout(() => {
      void this.tick().finally(() => this.schedule());
    }, this.pollIntervalMs);
  }

  /** Quét + publish một batch. Public để có thể trigger thủ công khi test. */
  async tick(): Promise<void> {
    if (this.running || this.stopped || !this.publisher) return;
    this.running = true;
    try {
      const pending = await this.outboxService.findPending(this.batchSize);
      for (const event of pending) {
        if (this.stopped) break;
        await this.publishOne(event);
      }
    } catch (err) {
      this.logger.error(`Outbox relay tick failed: ${this.errMsg(err)}`);
    } finally {
      this.running = false;
    }
  }

  private async publishOne(event: {
    id: string;
    eventType: string;
    attempts: number;
  }): Promise<void> {
    try {
      await this.publisher!.publish(event as any);
      await this.outboxService.markPublished(event.id);
      this.logger.debug(`Published outbox ${event.id} (${event.eventType}).`);
    } catch (err) {
      const attempts = (event.attempts ?? 0) + 1;
      const msg = this.errMsg(err);
      if (attempts >= this.maxAttempts) {
        await this.outboxService.markFailed(event.id, msg, attempts);
        this.logger.error(
          `Outbox ${event.id} (${event.eventType}) FAILED sau ${attempts} lần: ${msg}`,
        );
      } else {
        await this.outboxService.markRetry(event.id, msg, attempts);
        this.logger.warn(
          `Outbox ${event.id} (${event.eventType}) retry ${attempts}/${this.maxAttempts}: ${msg}`,
        );
      }
    }
  }

  private errMsg(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "unknown error";
    }
  }
}
