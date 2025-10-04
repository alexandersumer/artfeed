import { Injectable } from '@nestjs/common';
import { ArtworksService } from '../artworks/artworks.service';
import { IngestArtworkDto } from './dto/ingest-artwork.dto';

export interface IngestionResult {
  created: number;
  updated: number;
}

@Injectable()
export class IngestionService {
  constructor(private readonly artworksService: ArtworksService) {}

  async ingestBatch(items: IngestArtworkDto[]): Promise<IngestionResult> {
    let created = 0;
    let updated = 0;

    for (const item of items) {
      const existing = await this.artworksService.findBySourceIdentifier(item.source, item.sourceId);
      const payload = this.toArtworkPayload(item);
      await this.artworksService.upsertArtwork(
        payload,
        item.embedding,
        item.embeddingModel ?? 'clip-vit-b32',
        item.perceptualHash,
      );
      if (existing) {
        updated += 1;
      } else {
        created += 1;
      }
    }

    return { created, updated };
  }

  private toArtworkPayload(item: IngestArtworkDto): Partial<Parameters<ArtworksService['upsertArtwork']>[0]> {
    return {
      source: item.source,
      sourceId: item.sourceId,
      title: item.title,
      artist: item.artist,
      artistId: item.artistId,
      dateDisplay: item.dateDisplay,
      medium: item.medium,
      period: item.period,
      styles: item.styles,
      subjects: item.subjects,
      iiifManifestUrl: item.iiifManifestUrl ?? item.imageDetail?.detailIiif,
      iiifImageBase: item.iiifImageBase,
      imageUrlFull: item.imageUrlFull ?? item.imageDetail?.full,
      imageUrl1080: item.imageUrl1080 ?? item.imageUrlFull ?? item.imageDetail?.full,
      license: item.license,
      rights: item.rights,
      creditLine: item.creditLine,
      isPublicDomain: item.isPublicDomain,
      createdAt: item.createdAt,
      width: item.width,
      height: item.height,
    };
  }
}
