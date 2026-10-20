import { DynamicModule, Module } from "@nestjs/common";
import { OutboxService } from "./outbox.service";
import { OutboxModuleAsyncOptions, OutboxModuleOptions } from "./outbox.type";
import { OutboxScheduleService } from "./outbox.schedule";
import {
  OUTBOX_DATA_SOURCE,
  OUTBOX_MODULE_OPTIONS,
  OUTBOX_PUBLISHER,
} from "./outbox.constant";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxEvent } from "../entities";

@Module({})
export class OutboxModule {
  static registerAsync(options: OutboxModuleAsyncOptions): DynamicModule {
    return {
      module: OutboxModule,
      imports: [
        ...(options?.imports ?? []),
        TypeOrmModule.forFeature([OutboxEvent]),
      ],
      providers: [
        {
          provide: OUTBOX_MODULE_OPTIONS,
          useFactory: options.useFactory,
          inject: options.inject ?? [],
        },
        {
          provide: OUTBOX_DATA_SOURCE,
          useFactory: (options: OutboxModuleOptions) => options.dataSource,
          inject: [OUTBOX_MODULE_OPTIONS],
        },
        {
          provide: OUTBOX_PUBLISHER,
          useFactory: (options: OutboxModuleOptions) => options.publisher,
          inject: [OUTBOX_MODULE_OPTIONS],
        },
        OutboxService,
        OutboxScheduleService,
      ],
      exports: [OutboxService, OutboxScheduleService],
    };
  }
}
