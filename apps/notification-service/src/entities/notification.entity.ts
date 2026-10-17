import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';

export const TableName = 'notifications';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  LOG = 'LOG',
}

/**
 * Thông báo được tạo khi service nhận một domain event (vd order.confirmed).
 * Ở đây chỉ ghi log/lưu DB thay cho việc gửi email/SMS thật.
 */
@Entity(TableName)
@Index(['orderId'])
export class Notification extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  orderId: string | null;

  /** Loại event nguồn (vd order.confirmed, order.cancelled) */
  @Column({ type: 'varchar', length: 150 })
  eventType: string;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    default: NotificationChannel.LOG,
  })
  channel: NotificationChannel;

  @Column({ type: 'text' })
  message: string;

  /** Payload gốc của event, lưu để tra cứu */
  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, any> | null;
}
