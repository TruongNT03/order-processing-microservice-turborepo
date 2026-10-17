import { MigrationInterface, QueryRunner } from "typeorm";
import { createOutboxInfra, dropOutboxInfra } from "@repo/database";

export class CreateTablePayments1792091000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE payment_status_enum AS ENUM ('SUCCESS', 'FAILED', 'REFUNDED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE payments (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id       UUID NOT NULL,
        amount         FLOAT NOT NULL,
        status         payment_status_enum NOT NULL,
        transaction_id VARCHAR(100),
        failure_reason TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at     TIMESTAMPTZ
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_payments_order_id ON payments (order_id)`,
    );

    // Bảng hạ tầng outbox + inbox dùng cho Phase 3
    await createOutboxInfra(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropOutboxInfra(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS payments`);
    await queryRunner.query(`DROP TYPE IF EXISTS payment_status_enum`);
  }
}
