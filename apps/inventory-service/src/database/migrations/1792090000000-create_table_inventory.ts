import { MigrationInterface, QueryRunner } from 'typeorm';
import { createOutboxInfra, dropOutboxInfra } from '@repo/database';

export class CreateTableInventory1792090000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      CREATE TABLE inventories (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id  UUID NOT NULL,
        quantity    INT NOT NULL DEFAULT 0,
        reserved    INT NOT NULL DEFAULT 0,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ
      )
    `);

    await queryRunner.query(`
      CREATE TABLE reservations (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id    UUID NOT NULL,
        items       JSONB NOT NULL,
        status      VARCHAR(100) NOT NULL,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at  TIMESTAMPTZ
      )
    `);

    await createOutboxInfra(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropOutboxInfra(queryRunner as any);
    await queryRunner.query(`DROP TABLE IF EXISTS reservations`);
    await queryRunner.query(`DROP TABLE IF EXISTS inventories`);
  }
}
