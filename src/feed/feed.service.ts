import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FeedImpression } from './feed_impression.entity';
import { FeedCardDto } from './dto/feed-card.dto';
import { ArtworksService } from '../artworks/artworks.service';
import { RecommendationService } from '../recommendation/recommendation.service';
import { UsersService } from '../users/users.service';
import { Artwork } from '../artworks/artwork.entity';

const DEFAULT_COUNT = 20;
const CANDIDATE_POOL = 200;
const MODEL_VERSION = 'hybrid-0.1';

@Injectable()
export class FeedService {
  constructor(
    @InjectRepository(FeedImpression)
    private readonly impressionRepository: Repository<FeedImpression>,
    private readonly artworksService: ArtworksService,
    private readonly recommendationService: RecommendationService,
    private readonly usersService: UsersService,
  ) {}

  async getFeed(userId: string | undefined, count = DEFAULT_COUNT): Promise<{ cards: FeedCardDto[]; nextCursor?: string }> {
    const user = await this.usersService.ensureUser(userId);
    const profile = await this.usersService.getProfile(user.id);

    const candidates = await this.artworksService.findCandidates(CANDIDATE_POOL);

    const ranked = this.recommendationService.rankCandidates(
      profile?.embedding,
      candidates,
      {
        modelVersion: MODEL_VERSION,
      },
    );

    const cards = ranked.slice(0, count).map((item) => this.toFeedCard(item.artwork, item.score));

    await this.impressionRepository.save(
      cards.map((card, index) =>
        this.impressionRepository.create({
          user,
          artwork: { id: Number(card.id) } as Artwork,
          rank: index,
          score: card.score,
          modelVersion: MODEL_VERSION,
        }),
      ),
    );

    return { cards, nextCursor: cards.length ? cards[cards.length - 1].id : undefined };
  }

  private toFeedCard(artwork: Artwork, score: number): FeedCardDto {
    return {
      id: artwork.id.toString(),
      title: artwork.title,
      artist: artwork.artist,
      period: artwork.period,
      source: artwork.source,
      license: artwork.license,
      image: {
        feed: artwork.imageUrl1080,
        detail: {
          iiif: artwork.iiifImageBase ? `${artwork.iiifImageBase}/full/full/0/default.jpg` : undefined,
          full: artwork.imageUrlFull,
        },
      },
      credit: artwork.creditLine,
      score,
      modelVersion: MODEL_VERSION,
    };
  }
}
