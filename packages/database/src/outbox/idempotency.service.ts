import { Injectable } from "@nestjs/common";
import { EntityManager, QueryFailedError, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ProcessedMessage } from "../entities/processed-message.entity";

@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepo: Repository<ProcessedMessage>,
  ) {}

  async isProcessed(messageId: string, handler: string): Promise<boolean> {
    const found = await this.processedMessageRepo.findOne({
      where: { messageId, handler },
    });
    return !!found;
  }

  async markProcessed(
    manager: EntityManager,
    messageId: string,
    handler: string,
    messageType?: string,
  ): Promise<boolean> {
    try {
      await manager.insert(ProcessedMessage, {
        messageId,
        handler,
        messageType: messageType ?? null,
      });
      return true;
    } catch (err) {
      if (err instanceof QueryFailedError) {
        return false;
      }
      throw err;
    }
  }

  async runOnce<T>(
    manager: EntityManager,
    messageId: string,
    handler: string,
    work: (manager: EntityManager) => Promise<T>,
    messageType?: string,
  ): Promise<T | undefined> {
    const first = await this.markProcessed(
      manager,
      messageId,
      handler,
      messageType,
    );
    if (!first) {
      return undefined;
    }
    return work(manager);
  }
}
