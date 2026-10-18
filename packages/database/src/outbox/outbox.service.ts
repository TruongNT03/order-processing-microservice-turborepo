import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { OutboxEvent, OutboxStatus } from "../entities/outbox-event.entity";

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
    @InjectRepository(OutboxEvent)
    private readonly outboxRepo: Repository<OutboxEvent>,
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
    return this.outboxRepo.find({
      where: { status: OutboxStatus.PENDING },
      order: { createdAt: "ASC" },
      take: limit,
    });
  }

  async markPublished(id: string): Promise<void> {
    await this.outboxRepo.update(id, {
      status: OutboxStatus.PUBLISHED,
      publishedAt: new Date(),
    });
  }

  async markFailed(id: string, error: string, attempts: number): Promise<void> {
    await this.outboxRepo.update(id, {
      status: OutboxStatus.FAILED,
      lastError: error,
      attempts,
    });
  }

  async markRetry(id: string, error: string, attempts: number): Promise<void> {
    await this.outboxRepo.update(id, {
      status: OutboxStatus.PENDING,
      lastError: error,
      attempts,
    });
  }
}
