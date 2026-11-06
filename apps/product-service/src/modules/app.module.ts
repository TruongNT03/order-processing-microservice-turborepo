import { Module } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';
import { ProductModule } from './product/product.module';
import { RabbitMqModule } from '@repo/core';
import {
  AppConfigModule,
  rabbitmqConfiguration,
  RMQ_QUEUE,
} from '@repo/common';

@Module({
  imports: [
    AppConfigModule.forRoot({
      load: [databaseConfiguration, rabbitmqConfiguration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfiguration.KEY],
      useFactory: (
        databaseConfig: ConfigType<typeof databaseConfiguration>,
      ) => ({
        ...databaseConfig,
      }),
    }),
    RabbitMqModule.forRootAsync({
      inject: [rabbitmqConfiguration.KEY],
      useFactory: (
        rabbitmqConfig: ConfigType<typeof rabbitmqConfiguration>,
      ) => ({
        rabbitmqConfig,
        rabbitmqQueue: RMQ_QUEUE.PRODUCT,
      }),
    }),
    ProductModule,
  ],
})
export class AppModule {}
