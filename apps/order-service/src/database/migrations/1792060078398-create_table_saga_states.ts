import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableSagaStates1792060078398 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE saga_status_enum AS ENUM
          ('RUNNING', 'COMPLETED', 'COMPENSATING', 'COMPENSATED', 'FAILED');
      EXCEPTION WHEN duplicate_object THEN null; END $$;
    `);

    await queryRunner.query(`
      CREATE TABLE saga_states (
        id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        order_id       UUID NOT NULL,
        status         saga_status_enum NOT NULL DEFAULT 'RUNNING',
        current_step   VARCHAR(50),
        steps          JSONB NOT NULL DEFAULT '[]'::jsonb,
        failure_reason TEXT,
        created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        deleted_at     TIMESTAMPTZ
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX idx_saga_states_order_id ON saga_states (order_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS saga_states`);
    await queryRunner.query(`DROP TYPE IF EXISTS saga_status_enum`);
  }
}
