import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm";

export enum OutboxStatus {
  PENDING = "PENDING",
  PUBLISHED = "PUBLISHED",
  FAILED = "FAILED",
}

@Entity("outbox_events")
@Index(["status", "createdAt"])
export class OutboxEvent {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 100 })
  aggregateType: string;

  @Column({ type: "varchar", length: 100 })
  aggregateId: string;

  @Column({ type: "varchar", length: 150 })
  eventType: string;

  @Column({ type: "jsonb" })
  payload: Record<string, any>;

  @Column({ type: "varchar", length: 150, nullable: true })
  partitionKey: string | null;

  @Column({ type: "enum", enum: OutboxStatus, default: OutboxStatus.PENDING })
  status: OutboxStatus;

  @Column({ type: "int", default: 0 })
  attempts: number;

  @Column({ type: "text", nullable: true })
  lastError: string | null;

  @Column({ type: "timestamptz", nullable: true })
  publishedAt: Date | null;

  @Column({ type: "timestamptz", default: () => "NOW()" })
  createdAt: Date;
}
