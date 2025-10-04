import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { InteractionsService } from "./interactions.service";
import { InteractionsController } from "./interactions.controller";
import { Interaction } from "./interaction.entity";
import { FeedImpression } from "../feed/feed_impression.entity";
import { ArtworksModule } from "../artworks/artworks.module";
import { UsersModule } from "../users/users.module";
import { RecommendationModule } from "../recommendation/recommendation.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Interaction, FeedImpression]),
    ArtworksModule,
    UsersModule,
    RecommendationModule,
  ],
  providers: [InteractionsService],
  controllers: [InteractionsController],
  exports: [InteractionsService],
})
export class InteractionsModule {}
