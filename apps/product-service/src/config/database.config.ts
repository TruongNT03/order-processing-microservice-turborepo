import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

export const databaseConfig: TypeOrmModuleOptions = {
  type: (process.env.DB_TYPE as any) || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: +process.env.DB_PORT || 5432,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'test',
  entities: [__dirname + '../../src/entities/*.entity.{ts,js}'],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
};

export default registerAs('databaseConfig', () => databaseConfig);
