import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Artwork } from './artwork.entity';
import { ArtworkEmbedding } from './artwork_embedding.entity';

@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Artwork) private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(ArtworkEmbedding)
    private readonly embeddingRepository: Repository<ArtworkEmbedding>,
  ) {}

  async upsertArtwork(
    artwork: Partial<Artwork>,
    embedding?: number[],
    model?: string,
    phash?: string,
  ): Promise<Artwork> {
    const existing = artwork.source && artwork.sourceId
      ? await this.artworkRepository.findOne({
          where: { source: artwork.source, sourceId: artwork.sourceId },
        })
      : undefined;

    const entity = existing ? this.artworkRepository.merge(existing, artwork) : this.artworkRepository.create(artwork);
    const saved = await this.artworkRepository.save(entity);

    if (embedding) {
      const embeddingEntity = this.embeddingRepository.create({
        artworkId: saved.id,
        embedding,
        model,
        phash,
      });
      await this.embeddingRepository.save(embeddingEntity);
    }

    return saved;
  }

  async findById(id: number): Promise<Artwork | null> {
    return this.artworkRepository.findOne({ where: { id }, relations: ['embedding'] });
  }

  async findCandidates(limit: number, publicOnly = true): Promise<Artwork[]> {
    return this.artworkRepository.find({
      where: publicOnly ? { isPublicDomain: true } : {},
      relations: ['embedding'],
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async listAllEmbeddings(): Promise<ArtworkEmbedding[]> {
    return this.embeddingRepository.find({ relations: ['artwork'] });
  }
}
