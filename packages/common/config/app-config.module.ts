import { Module, DynamicModule, Global } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import * as path from "path";

/**
 * Nạp biến môi trường từ .env ở ROOT monorepo cho mọi service.
 * Service chạy từ apps/<name> nên cwd là thư mục service -> ta trỏ lên root.
 * Env thật của hệ điều hành (vd khi chạy Docker) vẫn được ưu tiên.
 */
@Global()
@Module({})
export class AppConfigModule {
  static forRoot(): DynamicModule {
    return {
      module: AppConfigModule,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          // Thử nhiều vị trí: cwd, lên 2 cấp (apps/x -> root), lên 3 cấp (dist)
          envFilePath: [
            ".env",
            path.resolve(process.cwd(), "../../.env"),
            path.resolve(process.cwd(), "../../../.env"),
          ],
          // Env hệ điều hành ghi đè file (ưu tiên cho Docker/CI)
          ignoreEnvFile: false,
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
