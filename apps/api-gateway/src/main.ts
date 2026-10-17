import { NestFactory } from '@nestjs/core';
import { WinstonModule } from 'nest-winston';
import { getLoggerTransport } from '@repo/common';
import { AppModule } from './modules/app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const logger = WinstonModule.createLogger(
    getLoggerTransport(AppModule.name, false),
  );

  const app = await NestFactory.create(AppModule, {
    logger,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Api Gateway')
    .setVersion('1.0')
    .build();
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, documentFactory);

  await app.listen(process.env.PORT ?? 8080);
}
bootstrap();
