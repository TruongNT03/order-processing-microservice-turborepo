import { Injectable } from "@nestjs/common";
import { EntityManager, QueryFailedError, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { ProcessedMessage } from "../entities/processed-message.entity";

/**
 * Idempotency (Inbox) pattern.
 *
 * Dùng để đảm bảo một message chỉ gây hiệu ứng một lần dù broker giao trùng.
 */
@Injectable()
export class IdempotencyService {
  constructor(
    @InjectRepository(ProcessedMessage)
    private readonly repo: Repository<ProcessedMessage>,
  ) {}

  /** Đã xử lý message này bởi handler này chưa? */
  async isProcessed(messageId: string, handler: string): Promise<boolean> {
    const found = await this.repo.findOne({
      where: { messageId, handler },
    });
    return !!found;
  }

  /**
   * Đánh dấu đã xử lý trong cùng transaction nghiệp vụ.
   * Trả về false nếu đã tồn tại (duplicate) để caller bỏ qua.
   */
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
      // Vi phạm unique PK -> message trùng, đã xử lý trước đó
      if (err instanceof QueryFailedError) {
        return false;
      }
      throw err;
    }
  }

  /**
   * Bọc một handler để chạy idempotent trong transaction:
   * nếu message đã xử lý -> skip; nếu chưa -> chạy work() rồi đánh dấu, commit chung.
   */
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
