import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';
import { WinstonModule } from 'nest-winston';
import { getLoggerTransport } from '@repo/common';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    WinstonModule.forRootAsync({
      useFactory: () => getLoggerTransport('Inventory Service', false),
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfiguration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfiguration.KEY],
      useFactory: (databaseConfig: ConfigType<typeof databaseConfiguration>) =>
        databaseConfig,
    }),
    InventoryModule,
  ],
})
export class AppModule {}
