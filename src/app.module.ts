import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";
import { DataSourceOptions } from "typeorm";
import { ArtworksModule } from "./artworks/artworks.module";
import { FeedModule } from "./feed/feed.module";
import { InteractionsModule } from "./interactions/interactions.module";
import { UsersModule } from "./users/users.module";
import databaseConfig from "./database/database.config";
import { IngestionModule } from "./ingestion/ingestion.module";
import { AuthModule } from "./auth/auth.module";
import { MetricsModule } from "./metrics/metrics.module";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig],
    }),
    ThrottlerModule.forRoot([{ ttl: 60, limit: 120 }]),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const databaseConfig = configService.get<
          DataSourceOptions & { autoSync: boolean }
        >("database");
        if (!databaseConfig) {
          throw new Error("Database configuration is missing");
        }
        const { autoSync, ...options } = databaseConfig;
        return {
          ...(options as DataSourceOptions),
          autoLoadEntities: true,
          synchronize: autoSync,
        };
      },
    }),
    UsersModule,
    ArtworksModule,
    FeedModule,
    InteractionsModule,
    IngestionModule,
    AuthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
