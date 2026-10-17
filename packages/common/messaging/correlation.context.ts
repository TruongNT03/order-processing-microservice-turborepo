import { AsyncLocalStorage } from "async_hooks";
import { randomUUID } from "crypto";

export const CORRELATION_ID_HEADER = "x-correlation-id";

interface CorrelationStore {
  correlationId: string;
}

export class CorrelationContext {
  private static als = new AsyncLocalStorage<CorrelationStore>();

  static run<T>(correlationId: string, fn: () => T): T {
    return this.als.run({ correlationId }, fn);
  }

  static getId(): string | undefined {
    return this.als.getStore()?.correlationId;
  }

  static getOrCreateId(): string {
    return this.getId() ?? randomUUID();
  }
}
