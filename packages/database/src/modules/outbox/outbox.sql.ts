import { QueryRunner } from "typeorm";

export async function createOutboxInfra(
  queryRunner: QueryRunner,
): Promise<void> {
  await queryRunner.query(`
    CREATE TABLE IF NOT EXISTS outbox_events (
      id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      aggregate_type VARCHAR(100) NOT NULL,
      aggregate_id   VARCHAR(100) NOT NULL,
      event_type     VARCHAR(150) NOT NULL,
      payload        JSONB NOT NULL,
      partition_key  VARCHAR(150),
      status         VARCHAR(150) NOT NULL DEFAULT 'PENDING',
      attempts       INT NOT NULL DEFAULT 0,
      last_error     TEXT,
      published_at   TIMESTAMPTZ,
      created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function dropOutboxInfra(queryRunner: QueryRunner): Promise<void> {
  await queryRunner.query(`DROP TABLE IF EXISTS outbox_events`);
}
