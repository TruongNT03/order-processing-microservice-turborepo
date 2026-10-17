import { Column, Entity, Index } from "typeorm";
import { BaseEntity } from "@repo/database";

export const TableName = "payments";

export enum PaymentStatus {
  SUCCESS = "SUCCESS",
  FAILED = "FAILED",
  REFUNDED = "REFUNDED",
}

/**
 * Bản ghi thanh toán (giả lập). Mỗi order có 1 payment.
 * Thành công/thất bại được quyết định ngẫu nhiên theo PAYMENT_FAIL_RATE
 * để mô phỏng lỗi và kích hoạt compensation trong saga.
 */
@Entity(TableName)
@Index(["orderId"], { unique: true })
export class Payment extends BaseEntity {
  @Column({ type: "uuid" })
  orderId: string;

  @Column({ type: "float" })
  amount: number;

  @Column({
    type: "enum",
    enum: PaymentStatus,
  })
  status: PaymentStatus;

  /** Mã giao dịch giả lập khi thành công */
  @Column({ type: "varchar", length: 100, nullable: true })
  transactionId: string | null;

  @Column({ type: "text", nullable: true })
  failureReason: string | null;
}
