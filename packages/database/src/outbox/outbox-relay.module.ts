import { DynamicModule, Module, Provider, Type } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OutboxEvent } from "../entities/outbox-event.entity";
import { OutboxService } from "./outbox.service";
import {
  OutboxRelayService,
  OUTBOX_RELAY_OPTIONS,
  OutboxRelayOptions,
} from "./outbox-relay.service";
import { OUTBOX_PUBLISHER } from "./outbox-publisher";

export interface OutboxRelayModuleOptions {
  publisher: Type<any>;
  imports?: any[];
  extraProviders?: Provider[];
  relayOptions?: OutboxRelayOptions;
}

@Module({})
export class OutboxRelayModule {
  static forRoot(options: OutboxRelayModuleOptions): DynamicModule {
    const publisherProvider: Provider = {
      provide: OUTBOX_PUBLISHER,
      useClass: options.publisher,
    };
    const optionsProvider: Provider = {
      provide: OUTBOX_RELAY_OPTIONS,
      useValue: options.relayOptions ?? {},
    };

    return {
      module: OutboxRelayModule,
      imports: [
        TypeOrmModule.forFeature([OutboxEvent]),
        ...(options.imports ?? []),
      ],
      providers: [
        OutboxService,
        OutboxRelayService,
        optionsProvider,
        ...(options.extraProviders ?? []),
        options.publisher,
        publisherProvider,
      ],
      exports: [OutboxService, OutboxRelayService],
    };
  }
}
