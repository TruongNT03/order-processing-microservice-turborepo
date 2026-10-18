import { OutboxEvent } from "../entities/outbox-event.entity";

export const OUTBOX_PUBLISHER = "OUTBOX_PUBLISHER";

export interface OutboxPublisher {
  publish(event: OutboxEvent): Promise<void>;
}
