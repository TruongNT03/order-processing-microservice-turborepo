import { DynamicModule, Global, Module } from "@nestjs/common";
import { ConfigType } from "@nestjs/config";
import { IRabbitMqQueue, rabbitmqConfiguration } from "@repo/common";
import { RmqTopologyService } from "./rabbitmq-topology.service";
import { RABBITMQ_CONFIG, RABBITMQ_QUEUE } from "./rabbitmq.constant";

export interface RabbitMqModuleOptions {
  rabbitmqConfig: ConfigType<typeof rabbitmqConfiguration>;
  rabbitmqQueue: IRabbitMqQueue;
}

export interface RabbitMqModuleAsyncOptions {
  inject?: any[];
  useFactory: (
    ...args: any[]
  ) => RabbitMqModuleOptions | Promise<RabbitMqModuleOptions>;
}

@Global()
@Module({})
export class RabbitMqModule {
  static forRootAsync(options: RabbitMqModuleAsyncOptions): DynamicModule {
    return {
      module: RabbitMqModule,
      controllers: [],
      imports: [],
      providers: [
        {
          provide: RABBITMQ_CONFIG,
          inject: options.inject ?? [],
          useFactory: async (...args: any[]) => {
            const moduleOptions = await options.useFactory(...args);
            return moduleOptions.rabbitmqConfig;
          },
        },
        {
          provide: RABBITMQ_QUEUE,
          inject: options.inject ?? [],
          useFactory: async (...args: any[]) => {
            const moduleOptions = await options.useFactory(...args);
            return moduleOptions.rabbitmqQueue;
          },
        },
        RmqTopologyService,
      ],
      exports: [RmqTopologyService],
    };
  }
}
