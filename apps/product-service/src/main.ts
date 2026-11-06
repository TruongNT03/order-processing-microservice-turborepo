import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './modules/app.module';
import { WinstonModule } from 'nest-winston';
import { getLoggerTransport, buildRmqOptions, RMQ_QUEUE } from '@repo/common';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';
  const logger = WinstonModule.createLogger(
    getLoggerTransport('Product Service', isProduction),
  );

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      logger,
      ...buildRmqOptions({ queue: RMQ_QUEUE.PRODUCT.MAIN.QUEUE }),
    },
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  await app.listen();
  logger.log(
    `Product Service is listening on queue ${RMQ_QUEUE.PRODUCT.MAIN.QUEUE}`,
  );
}
bootstrap();
