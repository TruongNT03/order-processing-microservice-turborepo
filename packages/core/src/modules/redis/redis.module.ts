import { Global, Logger, Module } from "@nestjs/common";
import { RedisService } from "./redis.service";
import { REDIS_PROVIDE } from "./redis.constant";
import Redis from "ioredis";
import { AppConfigModule, redisConfiguration } from "@repo/common";
import { ConfigModule, ConfigType } from "@nestjs/config";

@Global()
@Module({
  imports: [
    AppConfigModule.forRoot(),
    ConfigModule.forFeature(redisConfiguration),
  ],
  providers: [
    RedisService,
    {
      provide: REDIS_PROVIDE,
      inject: [redisConfiguration.KEY],
      useFactory: (redisConfig: ConfigType<typeof redisConfiguration>) => {
        const logger = new Logger();
        const redis = new Redis({
          host: redisConfig.host,
          port: +redisConfig.port,
        });

        redis.on("error", (err) => logger.error(err.message, { meta: err }));

        redis.on("connect", () => logger.log("Connect to Redis successfully!"));

        try {
          redis.ping();
        } catch (error: any) {
          throw new Error(error?.message);
        }

        return redis;
      },
    },
  ],
  exports: [REDIS_PROVIDE, RedisService],
})
export class RedisModule {}
