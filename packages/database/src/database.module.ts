import { DynamicModule, Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { buildDataSourceOptions } from "./data-source";

export interface DatabaseModuleOptions {
  database: string;
  entities: Function[];
  includeInfraEntities?: boolean;
}

@Module({})
export class DatabaseModule {
  static forService(options: DatabaseModuleOptions): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        TypeOrmModule.forRootAsync({
          useFactory: () =>
            buildDataSourceOptions({
              database: options.database,
              entities: options.entities,
            }),
        }),
      ],
      exports: [TypeOrmModule],
    };
  }
}
