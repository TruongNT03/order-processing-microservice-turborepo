import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { WinstonModule } from 'nest-winston';
import { ValidationPipe } from '@nestjs/common';
import {
  getLoggerTransport,
  buildKafkaOptions,
  RMQ_CLIENT,
  KAFKA_GROUP,
} from '@repo/common';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const logger = WinstonModule.createLogger(
    getLoggerTransport('Notification Service', isProduction),
  );

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      logger,
      options: {
        client: {
          clientId: 'NOTIFICATION_SERVICE',
          brokers: ['localhost:9092'],
        },
        consumer: {
          groupId: 'notification-service-group',
        },
      },
    },
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  await app.listen();
  logger.log(
    `Notification Service is listening on Kafka (group ${KAFKA_GROUP.NOTIFICATION})`,
  );
}
bootstrap();
