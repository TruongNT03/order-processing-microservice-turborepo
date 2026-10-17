import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { databaseConfiguration } from '../config';
import { ProductModule } from './product/product.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [databaseConfiguration] }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfiguration.KEY],
      useFactory: (
        databaseConfig: ConfigType<typeof databaseConfiguration>,
      ) => ({
        ...databaseConfig,
      }),
    }),
    ProductModule,
  ],
})
export class AppModule {}
