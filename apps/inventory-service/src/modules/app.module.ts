import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';
import { WINSTON_MODULE_PROVIDER, WinstonModule } from 'nest-winston';
import { Logger } from 'winston';
import { getLoggerTransport } from '@repo/common';
import { InventoryModule } from './inventory/inventory.module';
import { RedisModule } from '@repo/core';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => getLoggerTransport('Inventory Service', false),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfiguration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfiguration.KEY],
      useFactory: (databaseConfig: ConfigType<typeof databaseConfiguration>) =>
        databaseConfig,
    }),
    InventoryModule,
    RedisModule,
  ],
})
export class AppModule {}
