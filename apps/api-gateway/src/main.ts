import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { getLoggerTransport } from '@repo/common';
import { AppModule } from './modules/app.module';

async function bootstrap() {
  const logger = WinstonModule.createLogger(
    getLoggerTransport(AppModule.name, false),
  );

  const app = await NestFactory.create(AppModule, {
    logger,
  });
  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
