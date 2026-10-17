import { OutboxEvent } from "../entities/outbox-event.entity";

/** DI token cho publisher mà service tiêu thụ cung cấp. */
export const OUTBOX_PUBLISHER = "OUTBOX_PUBLISHER";

/**
 * Trừu tượng việc phát một outbox event ra broker.
 * `@repo/database` không biết transport cụ thể (Kafka/RMQ) — service dùng
 * relay sẽ cung cấp implementation (vd Kafka ClientProxy), nhờ đó package
 * database không phải phụ thuộc @nestjs/microservices.
 */
export interface OutboxPublisher {
  publish(event: OutboxEvent): Promise<void>;
}
