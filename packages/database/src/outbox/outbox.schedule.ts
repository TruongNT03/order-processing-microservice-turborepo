import { Inject, Injectable } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import {
  OUTBOX_BATCH_SIZE,
  OUTBOX_DATA_SOURCE,
  OUTBOX_MAX_ATTEMPTS,
  OUTBOX_PUBLISHER,
} from "./outbox.constant";
import { DataSource, LessThan, QueryRunner } from "typeorm";
import { OutboxPublisher } from "./outbox.type";
import { WINSTON_MODULE_PROVIDER } from "nest-winston";
import { Logger } from "winston";
import { OutboxEvent, OutboxStatus } from "../entities";

@Injectable()
export class OutboxScheduleService {
  private running = false;

  constructor(
    @Inject(OUTBOX_DATA_SOURCE)
    private readonly dataSource: DataSource,
    @Inject(OUTBOX_PUBLISHER)
    private readonly publisher: OutboxPublisher,
    @Inject(WINSTON_MODULE_PROVIDER)
    private readonly logger: Logger,
  ) {
    this.logger = this.logger.child({ context: OutboxScheduleService.name });
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async retryOutbox(): Promise<void> {
    this.logger.info("Starting run retryOutbox Cron Job");
    if (this.running) return;

    this.running = true;
    let eventCount: number;
    try {
      const events = await this.claimBatch(OUTBOX_BATCH_SIZE);
      eventCount = events.length;

      for (const event of events) {
        await this.publishEvent(event);
      }
    } catch (error: any) {
      this.logger.error("Failed to process outbox batch", error);
    } finally {
      this.logger.info(
        `Running retryOutbox Cron Jon successfully with ${eventCount} events`,
      );
      this.running = false;
    }
  }

  async claimBatch(limit: number): Promise<OutboxEvent[]> {
    return await this.dataSource.manager.find(OutboxEvent, {
      where: {
        status: OutboxStatus.PENDING,
        attempts: LessThan(OUTBOX_MAX_ATTEMPTS),
      },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  async publishEvent(event: OutboxEvent): Promise<void> {
    try {
      await this.publisher.publish(event.aggregateType, event.payload);

      await this.dataSource.manager.save(OutboxEvent, {
        id: event.id,
        status: OutboxStatus.PUBLISHED,
        publishedAt: new Date(),
      });
    } catch (error: any) {
      const nextAttempts = event.attempts + 1;
      const nextStatus =
        nextAttempts >= OUTBOX_MAX_ATTEMPTS
          ? OutboxStatus.FAILED
          : OutboxStatus.PENDING;

      this.logger.error(
        `Fail to publish eventID:${event.id} to aggregateType:${event.aggregateType} with retryCount:${nextAttempts}`,
        error,
      );

      await this.dataSource.manager.save(OutboxEvent, {
        id: event.id,
        attempts: nextAttempts,
        lastError: error?.message,
        status: nextStatus,
      });
    }
  }
}
