import { DataSource } from "typeorm";

export interface OutboxPublisher {
  publish(eventType: string, payload: any): Promise<void>;
}

export interface OutboxModuleOptions {
  dataSource: DataSource;
  publisher: OutboxPublisher;
}

export interface OutboxModuleAsyncOptions {
  imports?: any[];
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => OutboxModuleOptions | Promise<OutboxModuleOptions>;
}
