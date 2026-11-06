import { Inject, Injectable } from "@nestjs/common";
import { DataSource, EntityManager, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { OutboxEvent, OutboxStatus } from "../../entities/outbox-event.entity";
import { OUTBOX_DATA_SOURCE } from "./outbox.constant";

export interface SaveOutboxParams {
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: Record<string, any>;
  partitionKey?: string;
}

@Injectable()
export class OutboxService {
  constructor(
    @Inject(OUTBOX_DATA_SOURCE)
    private readonly dataSource: DataSource,
  ) {}

  async saveInTransaction(
    manager: EntityManager,
    params: SaveOutboxParams,
  ): Promise<OutboxEvent> {
    const event = manager.create(OutboxEvent, {
      aggregateType: params.aggregateType,
      aggregateId: params.aggregateId,
      eventType: params.eventType,
      payload: params.payload,
      partitionKey: params.partitionKey ?? params.aggregateId,
      status: OutboxStatus.PENDING,
    });
    return manager.save(event);
  }

  async findPending(limit = 50): Promise<OutboxEvent[]> {
    return this.dataSource.getRepository(OutboxEvent).find({
      where: { status: OutboxStatus.PENDING },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  async markPublished(id: string): Promise<void> {
    await this.dataSource.getRepository(OutboxEvent).update(id, {
      status: OutboxStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async markFailed(id: string, error: string, attempts: number): Promise<void> {
    await this.dataSource.getRepository(OutboxEvent).update(id, {
      status: OutboxStatus.FAILED,
      lastError: error,
      attempts,
    });
  }

  async markRetry(id: string, error: string, attempts: number): Promise<void> {
    await this.dataSource.getRepository(OutboxEvent).update(id, {
      status: OutboxStatus.PENDING,
      lastError: error,
      attempts,
    });
  }
}
