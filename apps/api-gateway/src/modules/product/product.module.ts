import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { buildRmqOptions, RMQ_CLIENT, RMQ_QUEUE } from '@repo/common';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: RMQ_CLIENT.PRODUCT,
        useFactory: () =>
          buildRmqOptions({
            queue: RMQ_QUEUE.PRODUCT.MAIN.QUEUE,
            noAck: true,
          }),
      },
    ]),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
