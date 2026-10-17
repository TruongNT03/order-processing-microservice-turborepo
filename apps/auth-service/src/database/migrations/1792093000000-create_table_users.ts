import { MigrationInterface, QueryRunner } from "typeorm";
import { createOutboxInfra, dropOutboxInfra } from "@repo/database";

export class CreateTableUsers1792093000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role_enum AS ENUM ('USER', 'ADMIN');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE users (
        id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email         VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        name          VARCHAR(100) NOT NULL,
        role          user_role_enum NOT NULL DEFAULT 'USER',
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at    TIMESTAMPTZ
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_users_email ON users (email)`,
    );

    // Bảng hạ tầng outbox + inbox dùng cho Phase 3
    await createOutboxInfra(queryRunner);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await dropOutboxInfra(queryRunner);
    await queryRunner.query(`DROP TABLE IF EXISTS users`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum`);
  }
}
