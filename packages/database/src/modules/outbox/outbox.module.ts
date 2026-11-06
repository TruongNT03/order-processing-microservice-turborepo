import { DynamicModule, Module } from "@nestjs/common";
import { OutboxService } from "./outbox.service";
import { OutboxModuleAsyncOptions, OutboxModuleOptions } from "./outbox.type";
import { OutboxScheduleService } from "./outbox.schedule";
import {
  OUTBOX_DATA_SOURCE,
  OUTBOX_MODULE_OPTIONS,
  OUTBOX_PUBLISHER,
} from "./outbox.constant";

@Module({})
export class OutboxModule {
  static registerAsync(options: OutboxModuleAsyncOptions): DynamicModule {
    return {
      module: OutboxModule,
      imports: [...(options?.imports ?? [])],
      providers: [
        {
          provide: OUTBOX_DATA_SOURCE,
          inject: options.inject ?? [],
          useFactory: async (...args: any[]) => {
            const moduleOptions = await options.useFactory(...args);
            return moduleOptions.dataSource;
          },
        },
        {
          provide: OUTBOX_PUBLISHER,
          inject: options.inject ?? [],
          useFactory: async (...args: any[]) => {
            const moduleOptions = await options.useFactory(...args);
            return moduleOptions.publisher;
          },
        },
        OutboxService,
        OutboxScheduleService,
      ],
      exports: [OutboxService, OutboxScheduleService],
    };
  }
}
