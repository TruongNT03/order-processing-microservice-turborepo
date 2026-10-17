import { Column, Entity, PrimaryColumn } from "typeorm";

/**
 * Inbox / Idempotency pattern.
 *
 * Broker giao message "at-least-once" nên consumer có thể nhận trùng.
 * Trước khi xử lý một message, consumer insert messageId vào bảng này.
 * Nếu đã tồn tại (unique PK) thì bỏ qua -> xử lý đúng-một-lần về mặt hiệu ứng.
 */
@Entity("processed_messages")
export class ProcessedMessage {
  /** messageId duy nhất của message (do producer sinh ra) */
  @PrimaryColumn({ type: "varchar", length: 150 })
  messageId: string;

  /** Consumer/handler nào đã xử lý, tránh đụng giữa nhiều handler */
  @PrimaryColumn({ type: "varchar", length: 150 })
  handler: string;

  @Column({ type: "varchar", length: 150, nullable: true })
  messageType: string | null;

  @Column({ type: "timestamptz", default: () => "NOW()" })
  processedAt: Date;
}
