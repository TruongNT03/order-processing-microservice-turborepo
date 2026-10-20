import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { RMQ_CLIENT } from '@repo/common';
import { OutboxPublisher } from '@repo/database';

@Injectable()
export class KafkaOutboxPublisher implements OutboxPublisher {
  constructor(
    @Inject(RMQ_CLIENT.KAFKA)
    private readonly kafkaClient: ClientProxy,
  ) {}

  async publish(eventType: string, payload: any): Promise<void> {
    await firstValueFrom(this.kafkaClient.emit(eventType, payload));
  }
}
