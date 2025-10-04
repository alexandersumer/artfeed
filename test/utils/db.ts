import { TypeOrmModule } from "@nestjs/typeorm";
import { DynamicModule } from "@nestjs/common";
import { Artwork } from "../../src/artworks/artwork.entity";
import { ArtworkEmbedding } from "../../src/artworks/artwork_embedding.entity";
import { User } from "../../src/users/user.entity";
import { UserProfile } from "../../src/users/user_profile.entity";
import { Interaction } from "../../src/interactions/interaction.entity";
import { FeedImpression } from "../../src/feed/feed_impression.entity";

export const SqliteTestingModule = (): DynamicModule =>
  TypeOrmModule.forRoot({
    type: "sqlite",
    database: ":memory:",
    dropSchema: true,
    entities: [
      Artwork,
      ArtworkEmbedding,
      User,
      UserProfile,
      Interaction,
      FeedImpression,
    ],
    synchronize: true,
    logging: false,
  });
