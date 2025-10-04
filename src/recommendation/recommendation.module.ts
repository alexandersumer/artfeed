import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { RecommendationService } from "./recommendation.service";
import { UsersModule } from "../users/users.module";
import { DefaultPersonalizationAdapter } from "./adapters/default-personalization.adapter";
import {
  PERSONALIZATION_PORT,
  PersonalizationPort,
} from "./personalization.port";

const DEFAULT_ENGINE = "default";

@Module({
  imports: [UsersModule, ConfigModule],
  providers: [
    RecommendationService,
    DefaultPersonalizationAdapter,
    {
      provide: PERSONALIZATION_PORT,
      useFactory: (
        configService: ConfigService,
        defaultAdapter: DefaultPersonalizationAdapter,
      ): PersonalizationPort => {
        const engine = configService.get<string>(
          "PERSONALIZATION_ENGINE",
          DEFAULT_ENGINE,
        );
        if (engine !== DEFAULT_ENGINE) {
          // Fallback to default adapter until alternative engines are wired.
          // Hook point kept for future branch-by-abstraction swaps.
        }
        return defaultAdapter;
      },
      inject: [ConfigService, DefaultPersonalizationAdapter],
    },
  ],
  exports: [RecommendationService, PERSONALIZATION_PORT],
})
export class RecommendationModule {}
