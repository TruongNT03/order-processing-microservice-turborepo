import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '@nestjs/microservices';
import { RMQ_CLIENT, RMQ_QUEUE, buildRmqOptions } from '@repo/common';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderSagaOrchestrator } from './saga/order-saga.orchestrator';
import { ResilientRpcService } from './saga/resilient-rpc.service';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { SagaState } from '../../entities/saga-state.entity';
import { OutboxModule } from '@repo/database';
import { KafkaOutboxModule } from '../kafka-outbox/kafka-outbox.module';
import { DataSource } from 'typeorm';
import { KafkaOutboxPublisher } from '../kafka-outbox/kafka-outbox.publisher';
import { RpcOrderController } from './rpc-order.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, SagaState]),
    ClientsModule.registerAsync([
      {
        name: RMQ_CLIENT.PRODUCT,
        useFactory: () =>
          buildRmqOptions({ queue: RMQ_QUEUE.PRODUCT.MAIN.QUEUE }),
      },
      {
        name: RMQ_CLIENT.INVENTORY,
        useFactory: () =>
          buildRmqOptions({ queue: RMQ_QUEUE.INVENTORY.MAIN.QUEUE }),
      },
      {
        name: RMQ_CLIENT.PAYMENT,
        useFactory: () =>
          buildRmqOptions({ queue: RMQ_QUEUE.PAYMENT.MAIN.QUEUE }),
      },
    ]),
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
  ],
  controllers: [OrderController, RpcOrderController],
  providers: [OrderService, OrderSagaOrchestrator, ResilientRpcService],
})
export class OrderModule {}
