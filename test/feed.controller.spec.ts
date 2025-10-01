import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { SqliteTestingModule } from './utils/db';
import { FeedModule } from '../src/feed/feed.module';
import { ArtworksModule } from '../src/artworks/artworks.module';
import { UsersModule } from '../src/users/users.module';
import { RecommendationModule } from '../src/recommendation/recommendation.module';
import { ArtworksService } from '../src/artworks/artworks.service';
import { Repository } from 'typeorm';
import { FeedImpression } from '../src/feed/feed_impression.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Artwork } from '../src/artworks/artwork.entity';
import { Server } from 'http';

const unitVector = (value: number[]): number[] => {
  const magnitude = Math.sqrt(value.reduce((sum, v) => sum + v * v, 0));
  return value.map((v) => (magnitude === 0 ? 0 : v / magnitude));
};

describe('FeedController (integration)', () => {
  let app: INestApplication;
  let impressionRepository: Repository<FeedImpression>;
  let artworksService: ArtworksService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SqliteTestingModule(), ArtworksModule, UsersModule, RecommendationModule, FeedModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();

    impressionRepository = moduleRef.get(getRepositoryToken(FeedImpression));
    artworksService = moduleRef.get(ArtworksService);

    const now = new Date();
    const seed = async (vector: number[], artist: string) => {
      const artworkPayload: Partial<Artwork> = {
        source: 'test',
        sourceId: `${artist}-${Math.random()}`,
        title: `Artwork ${artist}`,
        artist,
        isPublicDomain: true,
        creditLine: 'Test Museum',
        imageUrl1080: `https://example.com/${artist}_1080.jpg`,
        imageUrlFull: `https://example.com/${artist}_full.jpg`,
        createdAt: now,
      };
      await artworksService.upsertArtwork(artworkPayload, unitVector(vector), 'clip-test');
    };

    await seed([0.9, 0.1, 0], 'artist-a');
    await seed([0.8, 0.2, 0], 'artist-b');
    await seed([0.1, 0.9, 0], 'artist-b');
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns feed cards with impressions logged', async () => {
    const server = app.getHttpServer() as Server;
    const response = await request(server).get('/v1/feed');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.cards)).toBe(true);
    expect(response.body.cards.length).toBe(3);

    const impressions = await impressionRepository.find({ order: { rank: 'ASC' } });
    expect(impressions.length).toBe(3);
    impressions.forEach((impression, index) => {
      expect(impression.rank).toBe(index);
      expect(impression.score).toBeGreaterThanOrEqual(0);
    });
  });
});
