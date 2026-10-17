import { Column, Entity } from 'typeorm';
import { BaseEntity } from '@repo/database';

export const TableName = 'products';

@Entity(TableName)
export class Product extends BaseEntity {
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'float' })
  price: number;
}
