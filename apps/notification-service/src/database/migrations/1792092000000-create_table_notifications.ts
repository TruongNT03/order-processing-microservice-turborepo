import { MigrationInterface, QueryRunner } from 'typeorm';
import { createOutboxInfra, dropOutboxInfra } from '@repo/database';

export class CreateTableNotifications1792092000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE notification_channel_enum AS ENUM ('EMAIL', 'SMS', 'LOG');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id    UUID,
        event_type  VARCHAR(150) NOT NULL,
        channel     notification_channel_enum NOT NULL DEFAULT 'LOG',
        message     TEXT NOT NULL,
        payload     JSONB,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ
      )
    `);
    await queryRunner.query(
      `CREATE INDEX idx_notifications_order_id ON notifications (order_id)`,
    );

    // Bảng hạ tầng inbox (idempotency) dùng cho Phase 3
    await createOutboxInfra(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropOutboxInfra(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS notifications`);
    await queryRunner.query(`DROP TYPE IF EXISTS notification_channel_enum`);
  }
}
