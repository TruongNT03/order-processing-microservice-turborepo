import { DataSource } from "typeorm";

export interface InboxModuleOptions {
  dataSource: DataSource;
}

export interface InboxModuleAsyncOptions {
  import?: any[];
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => InboxModuleOptions | Promise<InboxModuleOptions>;
}
