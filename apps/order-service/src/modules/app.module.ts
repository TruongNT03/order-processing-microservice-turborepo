import { Module } from '@nestjs/common';
import { OrderModule } from './order/order.module';
import { WinstonModule } from 'nest-winston';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';
import { getLoggerTransport } from '@repo/common';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => getLoggerTransport('Order Service', false),
    }),
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfiguration] }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfiguration.KEY],
      useFactory: (
        databaseConfig: ConfigType<typeof databaseConfiguration>,
      ) => ({
        ...databaseConfig,
      }),
    }),
    OrderModule,
  ],
})
export class AppModule {}
