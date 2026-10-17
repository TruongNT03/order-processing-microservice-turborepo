import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';

export const TableName = 'reservations';

export enum ReservationStatus {
  RESERVED = 'RESERVED',
  RELEASED = 'RELEASED',
  COMMITTED = 'COMMITTED',
}

@Entity(TableName)
@Index(['orderId'])
export class Reservation extends BaseEntity {
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'jsonb' })
  items: { productId: string; quantity: number }[];

  @Column()
  status: ReservationStatus;
}
