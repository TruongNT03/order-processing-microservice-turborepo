import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientsModule } from '@nestjs/microservices';
import {
  RMQ_CLIENT,
  RMQ_QUEUE,
  KAFKA_GROUP,
  buildRmqOptions,
  buildKafkaOptions,
} from '@repo/common';
import { OutboxRelayModule } from '@repo/database';
import { OrderService } from './order.service';
import { OrderController } from './order.controller';
import { OrderSagaOrchestrator } from './saga/order-saga.orchestrator';
import { ResilientRpcService } from './saga/resilient-rpc.service';
import { KafkaOutboxPublisher } from './saga/kafka-outbox.publisher';
import { Order } from '../../entities/order.entity';
import { OrderItem } from '../../entities/order-item.entity';
import { SagaState } from '../../entities/saga-state.entity';

// Client Kafka để phát domain event (dùng bởi Outbox relay publisher).
const KafkaClientModule = ClientsModule.registerAsync([
  {
    name: RMQ_CLIENT.KAFKA,
    useFactory: () =>
      buildKafkaOptions({
        clientId: 'order-service',
        groupId: KAFKA_GROUP.ORDER,
      }),
  },
]);

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, SagaState]),
    // Client RMQ (request-reply) tới các service saga điều phối.
    ClientsModule.registerAsync([
      {
        name: RMQ_CLIENT.PRODUCT,
        useFactory: () => buildRmqOptions({ queue: RMQ_QUEUE.PRODUCT }),
      },
      {
        name: RMQ_CLIENT.INVENTORY,
        useFactory: () => buildRmqOptions({ queue: RMQ_QUEUE.INVENTORY }),
      },
      {
        name: RMQ_CLIENT.PAYMENT,
        useFactory: () => buildRmqOptions({ queue: RMQ_QUEUE.PAYMENT }),
      },
    ]),
    // Transactional Outbox relay: publish outbox event lên Kafka.
    OutboxRelayModule.forRoot({
      publisher: KafkaOutboxPublisher,
      imports: [KafkaClientModule],
    }),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderSagaOrchestrator, ResilientRpcService],
})
export class OrderModule {}
