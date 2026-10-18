import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from "typeorm";

export enum OutboxStatus {
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
  FAILED = "FAILED",
}

@Entity("outbox_events")
export class OutboxEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  aggregateType: string;

  @Column()
  aggregateId: string;

  @Column()
  eventType: string;

  @Column({ type: "jsonb" })
  payload: Record<string, any>;

  @Column()
  partitionKey: string | null;

  @Column()
  status: OutboxStatus;

  @Column()
  attempts: number;

  @Column()
  lastError: string | null;

  @Column()
  publishedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
