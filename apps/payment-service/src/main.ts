import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions } from "@nestjs/microservices";
import { WinstonModule } from "nest-winston";
import { ValidationPipe } from "@nestjs/common";
import { getLoggerTransport, buildRmqOptions, RMQ_QUEUE } from "@repo/common";
import { AppModule } from "./modules/app.module";

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === "production";
  const logger = WinstonModule.createLogger(
    getLoggerTransport("Payment Service", isProduction),
  );

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      logger,
      ...buildRmqOptions({ queue: RMQ_QUEUE.PAYMENT.MAIN.QUEUE }),
    },
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableShutdownHooks();

  await app.listen();
  logger.log(
    `Payment Service is listening on queue ${RMQ_QUEUE.PAYMENT.MAIN.QUEUE}`,
  );
}
bootstrap();
