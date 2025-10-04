import { Test, TestingModule } from '@nestjs/testing';
import { RecommendationModule } from '../src/recommendation/recommendation.module';
import { RecommendationService } from '../src/recommendation/recommendation.service';
import { UsersModule } from '../src/users/users.module';
import { UsersService } from '../src/users/users.service';
import { SqliteTestingModule } from './utils/db';
import { CreateInteractionDto } from '../src/interactions/dto/create-interaction.dto';
import { ArtworkEmbedding } from '../src/artworks/artwork_embedding.entity';
import { ArtworkWithEmbedding } from '../src/artworks/types';
import { ConfigModule } from '@nestjs/config';

const unitVector = (value: number[]): number[] => {
  const magnitude = Math.sqrt(value.reduce((sum, v) => sum + v * v, 0));
  return value.map((v) => (magnitude === 0 ? 0 : v / magnitude));
};

describe('RecommendationService', () => {
  let module: TestingModule;
  let service: RecommendationService;
  let usersService: UsersService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), SqliteTestingModule(), UsersModule, RecommendationModule],
    }).compile();

    service = module.get(RecommendationService);
    usersService = module.get(UsersService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('updates user taste vector on positive interactions', async () => {
    const user = await usersService.ensureUser();
    const embedding = unitVector([0.3, 0.4, 0.5]);

    const interaction = new CreateInteractionDto();
    interaction.artworkId = 1;
    interaction.eventType = 'like';

    await service.updateTasteFromInteraction(user.id, embedding, interaction);

    const updated = await usersService.getProfile(user.id);
    expect(updated).toBeTruthy();
    expect(updated?.embedding).toHaveLength(3);
    expect(updated?.embedding?.[0]).toBeGreaterThan(0);
  });

  it('down-weights negative events', async () => {
    const user = await usersService.ensureUser();
    const positive = unitVector([0.1, 0.1, 0.9]);
    const positiveInteraction = new CreateInteractionDto();
    positiveInteraction.artworkId = 1;
    positiveInteraction.eventType = 'like';
    await service.updateTasteFromInteraction(user.id, positive, positiveInteraction);

    const negative = unitVector([0.9, 0.1, 0.1]);
    const negativeInteraction = new CreateInteractionDto();
    negativeInteraction.artworkId = 2;
    negativeInteraction.eventType = 'hide';
    await service.updateTasteFromInteraction(user.id, negative, negativeInteraction);

    const updated = await usersService.getProfile(user.id);
    expect(updated).toBeTruthy();
    expect(updated?.embedding?.[0]).toBeLessThan(updated?.embedding?.[2] ?? 0);
  });

  it('ranks candidates preferring closer embeddings', () => {
    const userEmbedding = unitVector([1, 0, 0]);
    const makeArtwork = (id: number, vector: number[], artist = 'artist'): ArtworkWithEmbedding => ({
      id,
      source: 'test',
      sourceId: `source-${id}`,
      title: `Artwork ${id}`,
      artist,
      isPublicDomain: true,
      createdAt: new Date(),
      embedding: {
        artworkId: id,
        embedding: unitVector(vector),
      } as ArtworkEmbedding,
    });

    const candidates = [
      makeArtwork(1, [0.9, 0.1, 0]),
      makeArtwork(2, [0, 1, 0]),
      makeArtwork(3, [0.8, 0.2, 0]),
    ];

    const ranked = service.rankCandidates(userEmbedding, candidates, { modelVersion: 'test' });
    expect(ranked[0].artwork.id).toBe(1);
    expect(ranked[ranked.length - 1].artwork.id).toBe(2);
  });

  it('characterizes blended ranking of similarity, diversity, freshness, and exploration', () => {
    const baseTime = new Date('2025-01-01T00:00:00.000Z');
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(baseTime.getTime());

    const makeArtwork = (
      id: number,
      vector: number[],
      artist: string | undefined,
      createdOffsetDays: number,
    ): ArtworkWithEmbedding => ({
      id,
      source: 'test',
      sourceId: `source-${id}`,
      title: `Artwork ${id}`,
      artist,
      isPublicDomain: true,
      createdAt: new Date(baseTime.getTime() - createdOffsetDays * 24 * 60 * 60 * 1000),
      embedding: {
        artworkId: id,
        embedding: unitVector(vector),
      } as ArtworkEmbedding,
    });

    const userEmbedding = unitVector([0.7, 0.2, 0.1]);
    const candidates = [
      makeArtwork(1, [0.6, 0.3, 0.1], 'artist-a', 1),
      makeArtwork(2, [0.4, 0.6, 0], 'artist-a', 7),
      makeArtwork(3, [0.1, 0.1, 0.98], 'artist-b', 0.2),
      makeArtwork(4, [0.7, 0.2, 0.1], undefined, 30),
    ];

    const ranked = service.rankCandidates(userEmbedding, candidates, {
      modelVersion: 'characterization',
      freshnessHalfLifeDays: 14,
    });

    expect(
      ranked.map((entry) => ({ id: entry.artwork.id, score: entry.score })),
    ).toEqual([
      { id: 1, score: 0.8582 },
      { id: 4, score: 0.7996 },
      { id: 2, score: 0.6864 },
      { id: 3, score: 0.468 },
    ]);

    nowSpy.mockRestore();
  });
});
