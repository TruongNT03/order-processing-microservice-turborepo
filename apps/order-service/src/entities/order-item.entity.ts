import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from '@repo/database';
import { Order } from './order.entity';

export const TableName = 'order_items';

/**
 * Một dòng sản phẩm trong order. Lưu snapshot giá tại thời điểm đặt
 * (unitPrice) để không phụ thuộc giá product-service thay đổi về sau.
 */
@Entity(TableName)
export class OrderItem extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 150, nullable: true })
  productName: string | null;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'float' })
  unitPrice: number;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order: Order;

  @Column({ type: 'uuid' })
  orderId: string;
}
