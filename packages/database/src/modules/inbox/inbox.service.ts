import { Injectable } from "@nestjs/common";
import { EntityManager, QueryFailedError, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ProcessedMessage } from "../../entities/processed-message.entity";

@Injectable()
export class InboxService {
  constructor(
    @InjectRepository(ProcessedMessage)
    private readonly processedMessageRepo: Repository<ProcessedMessage>,
  ) {}

  async isProcessed(messageId: string): Promise<boolean> {
    const found = await this.processedMessageRepo.findOne({
      where: { messageId },
    });
    return !!found;
  }

  async markProcessed(
    manager: EntityManager,
    messageId: string,
    messageType?: string,
  ): Promise<boolean> {
    try {
      await manager.save(ProcessedMessage, {
        messageId,
        messageType: messageType ?? null,
        processedAt: new Date(),
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
    work: (manager: EntityManager) => Promise<T>,
    messageType?: string,
  ): Promise<T | undefined> {
    const first = await this.markProcessed(manager, messageId, messageType);
    if (!first) {
      return undefined;
    }
    return work(manager);
  }
}
