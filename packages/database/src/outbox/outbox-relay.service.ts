import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from "@nestjs/common";
import { OutboxService } from "./outbox.service";
import { OUTBOX_PUBLISHER, OutboxPublisher } from "./outbox-publisher";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";

export const OUTBOX_RELAY_OPTIONS = "OUTBOX_RELAY_OPTIONS";

export interface OutboxRelayOptions {
  pollIntervalMs?: number;
  batchSize?: number;
  maxAttempts?: number;
}

@Injectable()
export class OutboxRelayService implements OnModuleInit, OnModuleDestroy {
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
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {
    this.pollIntervalMs = options?.pollIntervalMs ?? 3000;
    this.batchSize = options?.batchSize ?? 50;
    this.maxAttempts = options?.maxAttempts ?? 5;
    this.logger = this.logger.child({ context: OutboxService.name });
  }

  onModuleInit(): void {
    if (!this.publisher) {
      this.logger.warn(
        "OutboxRelay không có OUTBOX_PUBLISHER -> relay không chạy.",
      );
      return;
    }
    this.schedule();
    this.logger.info(
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
