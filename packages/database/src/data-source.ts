import { DataSource, DataSourceOptions } from "typeorm";
import { SnakeNamingStrategy } from "typeorm-naming-strategies";

export interface BuildDataSourceParams {
  database: string;
  entities: (string | Function)[];
  migrations?: (string | Function)[];
  env?: NodeJS.ProcessEnv;
}

/**
 * Tạo DataSourceOptions chuẩn hoá cho mọi service.
 * Host/port/credential lấy từ env để chạy được cả local lẫn trong Docker.
 */
export const buildDataSourceOptions = (
  params: BuildDataSourceParams,
): DataSourceOptions => {
  const env = params.env ?? process.env;

  return {
    type: "postgres",
    host: env.DB_HOST ?? "localhost",
    port: parseInt(env.DB_PORT ?? "5433", 10),
    username: env.DB_USERNAME ?? "admin",
    password: env.DB_PASSWORD ?? "admin123",
    database: env.DB_NAME ?? params.database,
    entities: params.entities,
    migrations: params.migrations ?? [],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: false,
    logging: env.DB_LOGGING === "true",
  };
};

/**
 * Helper cho CLI typeorm (migration:run/revert) - mỗi service export 1 DataSource
 * dựng từ hàm này trong datasource.ts của nó.
 */
export const createAppDataSource = (
  params: BuildDataSourceParams,
): DataSource => new DataSource(buildDataSourceOptions(params));
