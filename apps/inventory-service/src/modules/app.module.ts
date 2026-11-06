import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';
import { WINSTON_MODULE_PROVIDER, WinstonModule } from 'nest-winston';
import { Logger } from 'winston';
import {
  AppConfigModule,
  getLoggerTransport,
  rabbitmqConfiguration,
  RMQ_QUEUE,
} from '@repo/common';
import { InventoryModule } from './inventory/inventory.module';
import { RabbitMqModule, RedisModule } from '@repo/core';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => getLoggerTransport('Inventory Service', false),
    }),
    AppConfigModule.forRoot({
      load: [databaseConfiguration, rabbitmqConfiguration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfiguration.KEY],
      useFactory: (databaseConfig: ConfigType<typeof databaseConfiguration>) =>
        databaseConfig,
    }),
    RabbitMqModule.forRootAsync({
      inject: [rabbitmqConfiguration.KEY],
      useFactory: (
        rabbitmqConfig: ConfigType<typeof rabbitmqConfiguration>,
      ) => ({
        rabbitmqConfig,
        rabbitmqQueue: RMQ_QUEUE.INVENTORY,
      }),
    }),
    InventoryModule,
    RedisModule,
  ],
})
export class AppModule {}
