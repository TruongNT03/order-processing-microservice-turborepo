import { Column, Entity, Index, OneToMany } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { OrderItem } from './order-item.entity';

export const TableName = 'orders';

/**
 * Trạng thái vòng đời của order (state machine):
 *   PENDING  → CONFIRMED  (saga thành công)
 *   PENDING  → CANCELLED  (bị compensation, vd payment fail)
 *   PENDING  → FAILED     (lỗi không thể bù trừ / validate thất bại sớm)
 */
export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  FAILED = 'FAILED',
}

@Entity(TableName)
export class Order extends BaseEntity {
  /** Người đặt hàng (lấy từ JWT qua gateway) */
  @Index()
  @Column({ type: 'uuid', nullable: true })
  userId: string | null;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  /** Tổng tiền chuẩn, tính từ giá product-service (không tin client) */
  @Column({ type: 'float', default: 0 })
  totalAmount: number;

  /** Lý do khi order FAILED/CANCELLED, phục vụ hiển thị + debug saga */
  @Column({ type: 'text', nullable: true })
  failureReason: string | null;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];
}
