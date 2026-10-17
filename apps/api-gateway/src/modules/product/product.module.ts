import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register({
      clients: [
        {
          name: 'PRODUCT_SERVICE',
          transport: Transport.RMQ,
          options: {
            urls: ['amqp://admin:admin123@localhost:5673'],
            queue: 'product_queue',
          },
        },
      ],
    }),
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
