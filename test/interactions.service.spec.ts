import { Test, TestingModule } from '@nestjs/testing';
import { SqliteTestingModule } from './utils/db';
import { InteractionsModule } from '../src/interactions/interactions.module';
import { InteractionsService } from '../src/interactions/interactions.service';
import { ArtworksModule } from '../src/artworks/artworks.module';
import { UsersModule } from '../src/users/users.module';
import { RecommendationModule } from '../src/recommendation/recommendation.module';
import { ArtworksService } from '../src/artworks/artworks.service';
import { Repository } from 'typeorm';
import { Interaction } from '../src/interactions/interaction.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from '../src/users/users.service';
import { ConfigModule } from '@nestjs/config';

const vector = (values: number[]): number[] => {
  const magnitude = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return values.map((v) => (magnitude === 0 ? 0 : v / magnitude));
};

describe('InteractionsService', () => {
  let module: TestingModule;
  let interactionsService: InteractionsService;
  let artworksService: ArtworksService;
  let interactionRepository: Repository<Interaction>;
  let usersService: UsersService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        SqliteTestingModule(),
        ArtworksModule,
        UsersModule,
        RecommendationModule,
        InteractionsModule,
      ],
    }).compile();

    interactionsService = module.get(InteractionsService);
    artworksService = module.get(ArtworksService);
    interactionRepository = module.get(getRepositoryToken(Interaction));
    usersService = module.get(UsersService);

    await artworksService.upsertArtwork(
      {
        source: 'test',
        sourceId: 'art-1',
        title: 'Test Artwork',
        artist: 'Tester',
        isPublicDomain: true,
      },
      vector([0.2, 0.8, 0]),
    );
  });

  afterEach(async () => {
    await module.close();
  });

  it('stores interaction and updates taste vector', async () => {
    const artwork = await artworksService.findCandidates(1).then((items) => items[0]);
    if (!artwork) {
      throw new Error('Seed artwork not found');
    }

    const user = await usersService.ensureUser();

    await interactionsService.recordInteraction(user.id, {
      artworkId: artwork.id,
      eventType: 'like',
      dwellMs: 2000,
    });

    const interactions = await interactionRepository.find({ relations: ['user'] });
    expect(interactions).toHaveLength(1);
    const [interaction] = interactions;
    expect(interaction.eventType).toBe('like');
    if (!interaction.user) {
      throw new Error('User relation missing on interaction');
    }

    const profile = await usersService.getProfile(interaction.user.id);
    expect(profile).toBeTruthy();
    expect(profile?.embedding?.[1]).toBeGreaterThan(0);
  });
});
