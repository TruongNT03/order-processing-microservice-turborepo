import { Module, DynamicModule, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as path from "path";

export interface IAppConfigModuleOptions {
  load?: any[];
}

@Global()
@Module({})
export class AppConfigModule {
  static forRoot(options?: IAppConfigModuleOptions): DynamicModule {
    return {
      module: AppConfigModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: options?.load ?? [],
          envFilePath: [
            ".env",
            path.resolve(process.cwd(), "../../.env"),
            path.resolve(process.cwd(), "../../../.env"),
          ],
          ignoreEnvFile: false,
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
