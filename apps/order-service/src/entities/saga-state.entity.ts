import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '@repo/database';

export const TableName = 'saga_states';

export enum SagaStatus {
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  COMPENSATING = 'COMPENSATING',
  COMPENSATED = 'COMPENSATED',
  FAILED = 'FAILED',
}

export enum SagaStep {
  VALIDATE_PRODUCT = 'VALIDATE_PRODUCT',
  RESERVE_INVENTORY = 'RESERVE_INVENTORY',
  PROCESS_PAYMENT = 'PROCESS_PAYMENT',
  CONFIRM_ORDER = 'CONFIRM_ORDER',
}

export enum StepStatus {
  STARTED = 'STARTED',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  COMPENSATED = 'COMPENSATED',
}

export interface SagaStepLog {
  step: SagaStep | string;
  status: StepStatus;
  reason?: string;
  at: string;
}

@Entity(TableName)
export class SagaState extends BaseEntity {
  /** Order mà saga này điều phối (1-1). */
  @Index({ unique: true })
  @Column({ type: 'uuid' })
  orderId: string;

  @Column({
    type: 'enum',
    enum: SagaStatus,
    default: SagaStatus.RUNNING,
  })
  status: SagaStatus;

  /** Bước gần nhất đang/đã xử lý, phục vụ debug nhanh. */
  @Column({ type: 'varchar', length: 50, nullable: true })
  currentStep: SagaStep | null;

  /** Lịch sử từng bước (forward + compensation). */
  @Column({ type: 'jsonb', default: () => "'[]'::jsonb" })
  steps: SagaStepLog[];

  @Column({ type: 'text', nullable: true })
  failureReason: string | null;
}
