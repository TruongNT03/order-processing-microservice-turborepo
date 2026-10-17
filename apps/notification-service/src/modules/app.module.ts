import { Module } from '@nestjs/common';
import { NotificationModule } from './notification/notification.module';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfiguration],
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfiguration.KEY],
      useFactory: (
        databaseConfig: ConfigType<typeof databaseConfiguration>,
      ) => ({
        ...databaseConfig,
      }),
    }),
    NotificationModule,
  ],
})
export class AppModule {}
