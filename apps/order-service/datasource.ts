import * as path from 'path';
import { databaseConfig } from './src/config/database.config';
import { DataSource, DataSourceOptions } from 'typeorm';

export const appdataSourceOption: DataSourceOptions = {
  ...databaseConfig,
  entities: [path.join(__dirname, 'src/**/*.entity.{ts,js}')],
  migrations: [path.join(__dirname, 'src/database/migrations/*.{ts,js}')],
} as DataSourceOptions;

const AppDataSource = new DataSource(appdataSourceOption);

export default AppDataSource;
