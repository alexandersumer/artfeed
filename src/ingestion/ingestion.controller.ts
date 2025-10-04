import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { IngestionService } from "./ingestion.service";
import { IngestBatchDto } from "./dto/ingest-batch.dto";
import { IngestionApiKeyGuard } from "./ingestion-api-key.guard";

@Controller("internal/ingestion")
@UseGuards(IngestionApiKeyGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("batch")
  async ingestBatch(@Body() dto: IngestBatchDto) {
    const result = await this.ingestionService.ingestBatch(dto.items);
    return {
      status: "ok",
      ...result,
      total: dto.items.length,
    };
  }
}
