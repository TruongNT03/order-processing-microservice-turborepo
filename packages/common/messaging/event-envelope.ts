import { randomUUID } from "crypto";

export interface EventEnvelope<T = any> {
  messageId: string;
  correlationId: string;
  type: string;
  occurredAt: string;
  data: T;
}

export const createEnvelope = <T>(
  type: string,
  data: T,
  correlationId?: string,
): EventEnvelope<T> => ({
  messageId: randomUUID(),
  correlationId: correlationId ?? randomUUID(),
  type,
  occurredAt: new Date().toISOString(),
  data,
});
