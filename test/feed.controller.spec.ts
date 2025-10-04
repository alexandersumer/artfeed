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
import { AuthModule } from '../src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

const unitVector = (value: number[]): number[] => {
  const magnitude = Math.sqrt(value.reduce((sum, v) => sum + v * v, 0));
  return value.map((v) => (magnitude === 0 ? 0 : v / magnitude));
};

describe('FeedController (integration)', () => {
  let app: INestApplication;
  let impressionRepository: Repository<FeedImpression>;
  let artworksService: ArtworksService;
  let jwtService: JwtService;
  
  const baseTime = new Date('2025-01-01T00:00:00.000Z');
  let seededArtworkIds: number[] = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = 'test-secret';
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        SqliteTestingModule(),
        ArtworksModule,
        UsersModule,
        RecommendationModule,
        AuthModule,
        FeedModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();

    impressionRepository = moduleRef.get(getRepositoryToken(FeedImpression));
    artworksService = moduleRef.get(ArtworksService);
    jwtService = moduleRef.get(JwtService);

    const seed = async (vector: number[], artist: string, label: string) => {
      const artworkPayload: Partial<Artwork> = {
        source: 'test',
        sourceId: `${artist}-${label}`,
        title: `Artwork ${artist}-${label}`,
        artist,
        isPublicDomain: true,
        creditLine: 'Test Museum',
        imageUrl1080: `https://example.com/${artist}_1080.jpg`,
        imageUrlFull: `https://example.com/${artist}_full.jpg`,
        createdAt: baseTime,
      };
      const saved = await artworksService.upsertArtwork(artworkPayload, unitVector(vector), 'clip-test');
      return saved.id;
    };

    seededArtworkIds = [
      await seed([0.9, 0.1, 0], 'artist-a', 'primary'),
      await seed([0.8, 0.2, 0], 'artist-b', 'blend'),
      await seed([0.1, 0.9, 0], 'artist-b', 'off-axis'),
    ];
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns feed cards with impressions logged', async () => {
    const server = app.getHttpServer() as Server;
    const token = jwtService.sign({ sub: 'test-user' });
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(baseTime.getTime());
    const response = await request(server)
      .get('/v1/feed')
      .set('Authorization', `Bearer ${token}`);
    nowSpy.mockRestore();

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.cards)).toBe(true);
    expect(response.body.cards.length).toBe(3);

    expect(
      response.body.cards.map((card: { id: string; title: string; modelVersion: string; score: number }) => ({
        id: Number(card.id),
        title: card.title,
        modelVersion: card.modelVersion,
        score: card.score,
      })),
    ).toEqual([
      {
        id: seededArtworkIds[0],
        title: 'Artwork artist-a-primary',
        modelVersion: 'hybrid-0.1',
        score: 0.299,
      },
      {
        id: seededArtworkIds[2],
        title: 'Artwork artist-b-off-axis',
        modelVersion: 'hybrid-0.1',
        score: 0.226,
      },
      {
        id: seededArtworkIds[1],
        title: 'Artwork artist-b-blend',
        modelVersion: 'hybrid-0.1',
        score: 0.225,
      },
    ]);

    const impressions = await impressionRepository.find({ order: { rank: 'ASC' } });
    expect(impressions.length).toBe(3);
    impressions.forEach((impression, index) => {
      expect(impression.rank).toBe(index);
      expect(impression.score).toBeGreaterThanOrEqual(0);
    });
  });
});
