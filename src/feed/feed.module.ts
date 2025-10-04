import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FeedService } from "./feed.service";
import { FeedController } from "./feed.controller";
import { FeedImpression } from "./feed_impression.entity";
import { ArtworksModule } from "../artworks/artworks.module";
import { RecommendationModule } from "../recommendation/recommendation.module";
import { UsersModule } from "../users/users.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([FeedImpression]),
    ArtworksModule,
    RecommendationModule,
    UsersModule,
  ],
  providers: [FeedService],
  controllers: [FeedController],
  exports: [FeedService],
})
export class FeedModule {}
