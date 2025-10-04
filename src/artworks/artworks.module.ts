import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Artwork } from "./artwork.entity";
import { ArtworkEmbedding } from "./artwork_embedding.entity";
import { ArtworksService } from "./artworks.service";
import { ArtworksController } from "./artworks.controller";

@Module({
  imports: [TypeOrmModule.forFeature([Artwork, ArtworkEmbedding])],
  providers: [ArtworksService],
  controllers: [ArtworksController],
  exports: [ArtworksService, TypeOrmModule],
})
export class ArtworksModule {}
