import { MigrationInterface, QueryRunner } from 'typeorm';
import { createOutboxInfra, dropOutboxInfra } from '@repo/database';

export class CreateTableOrders1792060078397 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE order_status_enum AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE orders (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id        UUID,
        status         order_status_enum NOT NULL DEFAULT 'PENDING',
        total_amount   FLOAT NOT NULL DEFAULT 0,
        failure_reason TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at     TIMESTAMPTZ
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_orders_user_id ON orders (user_id)`,
    );

    await queryRunner.query(`
      CREATE TABLE order_items (
        id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id   UUID NOT NULL,
        product_name VARCHAR(150),
        quantity     INT NOT NULL,
        unit_price   FLOAT NOT NULL,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at   TIMESTAMPTZ
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_order_items_order_id ON order_items (order_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_order_items_product_id ON order_items (product_id)`,
    );

    // Bảng hạ tầng outbox + inbox dùng cho saga/reliable messaging (Phase 2-3)
    await createOutboxInfra(queryRunner as any);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropOutboxInfra(queryRunner as any);
    await queryRunner.query(`DROP TABLE IF EXISTS order_items`);
    await queryRunner.query(`DROP TABLE IF EXISTS orders`);
    await queryRunner.query(`DROP TYPE IF EXISTS order_status_enum`);
  }
}
