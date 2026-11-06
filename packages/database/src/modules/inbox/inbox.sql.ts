import { QueryRunner } from "typeorm";

export async function createInboxInfra(
  queryRunner: QueryRunner,
): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS processed_messages (
      message_id UUID PRIMARY NOT NULL,
      message_type VARCHAR(150),
      processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    )
  `);
}

export async function dropInboxInfra(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE IF EXISTS processed_messages`);
}
