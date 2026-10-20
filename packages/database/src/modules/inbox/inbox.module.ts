import { DynamicModule, Module } from "@nestjs/common";
import { InboxService } from "./inbox.service";
import { InboxModuleAsyncOptions, InboxModuleOptions } from "./inbox.type";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProcessedMessage } from "../../entities";
import { INBOX_DATA_SOURCE, INBOX_MODULE_OPTIONS } from "./inbox.constant";

@Module({})
export class InboxModule {
  static registerAsync(options: InboxModuleAsyncOptions): DynamicModule {
    return {
      module: InboxModule,
      global: true,
      imports: [
        ...(options?.import ?? []),
        TypeOrmModule.forFeature([ProcessedMessage]),
      ],
      providers: [
        {
          provide: INBOX_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options?.inject ?? [],
        },
        {
          provide: INBOX_DATA_SOURCE,
          useFactory: (options: InboxModuleOptions) => options.dataSource,
          inject: [INBOX_MODULE_OPTIONS],
        },
        InboxService,
      ],
      exports: [InboxService],
    };
  }
}
