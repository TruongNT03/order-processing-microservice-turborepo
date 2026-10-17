import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RMQ_CLIENT, createEnvelope } from '@repo/common';
import { OutboxEvent, OutboxPublisher } from '@repo/database';

/**
 * Publisher dùng cho Outbox relay: phát domain event lên Kafka.
 * Topic = eventType của outbox row. Payload được bọc trong EventEnvelope,
 * dùng chính outbox id làm messageId để consumer idempotent ổn định
 * qua các lần relay thử lại (at-least-once).
 */
@Injectable()
export class KafkaOutboxPublisher implements OutboxPublisher {
  constructor(
    @Inject(RMQ_CLIENT.KAFKA)
    private readonly kafkaClient: ClientProxy,
  ) {}

  async publish(event: OutboxEvent): Promise<void> {
    const envelope = createEnvelope(
      event.eventType,
      event.payload,
      event.id, // correlationId ổn định theo outbox row
    );
    // messageId cố định theo outbox id để inbox idempotency không trùng lặp
    envelope.messageId = event.id;

    await firstValueFrom(this.kafkaClient.emit(event.eventType, envelope));
  }
}
