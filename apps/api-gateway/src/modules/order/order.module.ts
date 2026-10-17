import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { RMQ_CLIENT, RMQ_QUEUE, buildRmqOptions } from '@repo/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: RMQ_CLIENT.ORDER,
        useFactory: () => buildRmqOptions({ queue: RMQ_QUEUE.ORDER }),
      },
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService],
})
export class OrderModule {}
