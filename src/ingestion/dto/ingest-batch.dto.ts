import { Type } from 'class-transformer';
import { ArrayNotEmpty, ValidateNested } from 'class-validator';
import { IngestArtworkDto } from './ingest-artwork.dto';

export class IngestBatchDto {
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => IngestArtworkDto)
  items!: IngestArtworkDto[];
}
