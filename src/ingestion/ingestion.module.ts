import { Module } from "@nestjs/common";
import { ArtworksModule } from "../artworks/artworks.module";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";
import { IngestionApiKeyGuard } from "./ingestion-api-key.guard";

@Module({
  imports: [ArtworksModule],
  controllers: [IngestionController],
  providers: [IngestionService, IngestionApiKeyGuard],
  exports: [IngestionService],
})
export class IngestionModule {}
