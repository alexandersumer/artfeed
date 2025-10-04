import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { Artwork } from "./artwork.entity";
import { ArtworkEmbedding } from "./artwork_embedding.entity";
import { ArtworkWithEmbedding } from "./types";

@Injectable()
export class ArtworksService {
  constructor(
    @InjectRepository(Artwork)
    private readonly artworkRepository: Repository<Artwork>,
    @InjectRepository(ArtworkEmbedding)
    private readonly embeddingRepository: Repository<ArtworkEmbedding>,
  ) {}

  async upsertArtwork(
    artwork: Partial<Artwork>,
    embedding?: number[],
    model?: string,
    phash?: string,
  ): Promise<Artwork> {
    const existing =
      artwork.source && artwork.sourceId
        ? await this.artworkRepository.findOne({
            where: { source: artwork.source, sourceId: artwork.sourceId },
          })
        : undefined;

    const entity = existing
      ? this.artworkRepository.merge(existing, artwork)
      : this.artworkRepository.create(artwork);
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

  async findById(id: number): Promise<ArtworkWithEmbedding | null> {
    const artwork = await this.artworkRepository.findOne({ where: { id } });
    if (!artwork) {
      return null;
    }
    await this.attachEmbeddings([artwork]);
    return artwork as ArtworkWithEmbedding;
  }

  async findBySourceIdentifier(
    source: string,
    sourceId: string,
  ): Promise<ArtworkWithEmbedding | null> {
    const artwork = await this.artworkRepository.findOne({
      where: { source, sourceId },
    });
    if (!artwork) {
      return null;
    }
    await this.attachEmbeddings([artwork]);
    return artwork as ArtworkWithEmbedding;
  }

  async findCandidates(
    limit: number,
    publicOnly = true,
  ): Promise<ArtworkWithEmbedding[]> {
    const artworks = await this.artworkRepository.find({
      where: publicOnly ? { isPublicDomain: true } : {},
      take: limit,
      order: { createdAt: "DESC" },
    });
    await this.attachEmbeddings(artworks);
    return artworks as ArtworkWithEmbedding[];
  }

  async listAllEmbeddings(): Promise<ArtworkEmbedding[]> {
    return this.embeddingRepository.find({ relations: ["artwork"] });
  }

  private async attachEmbeddings(artworks: Artwork[]): Promise<void> {
    if (artworks.length === 0) {
      return;
    }
    const ids = artworks.map((item) => item.id);
    const embeddings = await this.embeddingRepository.find({
      where: { artworkId: In(ids) },
    });
    const lookup = new Map(
      embeddings.map((embedding) => [embedding.artworkId, embedding]),
    );
    artworks.forEach((artwork) => {
      const embedding = lookup.get(artwork.id);
      if (embedding) {
        (artwork as ArtworkWithEmbedding).embedding = embedding;
      }
    });
  }
}
