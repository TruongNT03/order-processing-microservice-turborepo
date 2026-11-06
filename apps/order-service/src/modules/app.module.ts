import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';
import {
  AppConfigModule,
  getLoggerTransport,
  IRabbitMqQueue,
  rabbitmqConfiguration,
  RMQ_QUEUE,
  RmqManualAckInterceptor,
} from '@repo/common';
import { KafkaOutboxModule } from './kafka-outbox/kafka-outbox.module';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { OutboxModule } from '@repo/database';
import { DataSource } from 'typeorm';
import { KafkaOutboxPublisher } from './kafka-outbox/kafka-outbox.publisher';
import { RabbitMqModule } from '@repo/core';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => getLoggerTransport('Order Service', false),
    }),
    ScheduleModule.forRoot(),
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
        rabbitmqQueue: RMQ_QUEUE.ORDER,
      }),
    }),
    OutboxModule.registerAsync({
      imports: [KafkaOutboxModule],
      inject: [DataSource, KafkaOutboxPublisher],
      useFactory: (
        dataSource: DataSource,
        publisher: KafkaOutboxPublisher,
      ) => ({
        dataSource,
        publisher,
      }),
    }),
    OrderModule,
    KafkaOutboxModule,
  ],
  providers: [],
})
export class AppModule {}
