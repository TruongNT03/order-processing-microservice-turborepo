import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';

export const TableName = 'inventories';

@Entity(TableName)
export class Inventory extends BaseEntity {
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'int', default: 0 })
  quantity: number;

  @Column({ type: 'int', default: 0 })
  reserved: number;

  get available(): number {
    return this.quantity - this.reserved;
  }
}
