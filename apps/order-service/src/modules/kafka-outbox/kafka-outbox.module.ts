import { Module } from '@nestjs/common';
import { ClientsModule } from '@nestjs/microservices';
import { buildKafkaOptions, KAFKA_GROUP, RMQ_CLIENT } from '@repo/common';
import { KafkaOutboxPublisher } from './kafka-outbox.publisher';

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
  imports: [KafkaClientModule],
  providers: [KafkaOutboxPublisher],
  exports: [KafkaOutboxPublisher],
})
export class KafkaOutboxModule {}
