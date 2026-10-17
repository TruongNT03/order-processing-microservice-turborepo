import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxEvent } from "../entities/outbox-event.entity";
import { ProcessedMessage } from "../entities/processed-message.entity";
import { OutboxService } from "./outbox.service";
import { IdempotencyService } from "./idempotency.service";

@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent, ProcessedMessage])],
  providers: [OutboxService, IdempotencyService],
  exports: [OutboxService, IdempotencyService, TypeOrmModule],
})
export class OutboxModule {}
