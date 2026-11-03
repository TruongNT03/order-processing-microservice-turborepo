import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  Notification,
  NotificationChannel,
} from '../../entities/notification.entity';

export interface RecordNotificationInput {
  orderId?: string | null;
  eventType: string;
  message: string;
  payload?: Record<string, any> | null;
  channel?: NotificationChannel;
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Lưu + log một thông báo. Thay cho việc gửi email/SMS thật trong demo.
   */
  async record(input: RecordNotificationInput): Promise<Notification> {
    const notification = this.notificationRepo.create({
      orderId: input.orderId ?? null,
      eventType: input.eventType,
      message: input.message,
      payload: input.payload ?? null,
      channel: input.channel ?? NotificationChannel.LOG,
    });
    const saved = await this.notificationRepo.save(notification);
    this.logger.log(
      `[NOTIFY] (${saved.eventType}) order=${saved.orderId ?? '-'}: ${saved.message}`,
    );
    return saved;
  }

  /**
   * Inbox (idempotency) pattern: chỉ ghi notification một lần cho mỗi
   * (messageId, handler), dù Kafka giao message trùng (at-least-once).
   * Việc đánh dấu đã xử lý + ghi notification nằm trong cùng transaction.
   */
  async recordOnce(
    messageId: string,
    handler: string,
    input: RecordNotificationInput,
  ): Promise<void> {
    // const result = await this.dataSource.transaction(async (manager) =>
    //   this.idempotency.runOnce(
    //     manager as any,
    //     messageId,
    //     handler,
    //     async (m) => {
    //       const notification = m.create(Notification, {
    //         orderId: input.orderId ?? null,
    //         eventType: input.eventType,
    //         message: input.message,
    //         payload: input.payload ?? null,
    //         channel: input.channel ?? NotificationChannel.LOG,
    //       });
    //       return m.save(notification);
    //     },
    //     input.eventType,
    //   ),
    // );
    // if (result === undefined) {
    //   this.logger.debug(`Skip duplicate message ${messageId} (${handler}).`);
    //   return;
    // }
    // this.logger.log(
    //   `[NOTIFY] (${input.eventType}) order=${input.orderId ?? '-'}: ${input.message}`,
    // );
  }

  async findAll(): Promise<Notification[]> {
    return this.notificationRepo.find({ order: { createdAt: 'DESC' } });
  }
}
