import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableProducts1792088337060 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
        CREATE TABLE products (
            id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name        VARCHAR(100) UNIQUE NOT NULL,
            description TEXT,
            price       FLOAT NOT NULL,
            created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            deleted_at  TIMESTAMPTZ
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS products`);
  }
}
