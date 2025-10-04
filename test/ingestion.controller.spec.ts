import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { Server } from 'http';
import { ConfigModule } from '@nestjs/config';
import { SqliteTestingModule } from './utils/db';
import { ArtworksModule } from '../src/artworks/artworks.module';
import { IngestionModule } from '../src/ingestion/ingestion.module';
import { ArtworksService } from '../src/artworks/artworks.service';

const API_KEY = 'super-secret-ingest';

describe('IngestionController (integration)', () => {
  let app: INestApplication;
  let artworksService: ArtworksService;
  const originalEnv = { ...process.env };

  beforeAll(async () => {
    process.env.INGESTION_API_KEY = API_KEY;

    const moduleRef = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), SqliteTestingModule(), ArtworksModule, IngestionModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('v1');
    await app.init();

    artworksService = moduleRef.get(ArtworksService);
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    process.env = { ...originalEnv };
  });

  it('ingests artworks and upserts embeddings idempotently', async () => {
    const payload = {
      items: [
        {
          source: 'met',
          sourceId: '12345',
          title: 'Test Artwork',
          artist: 'Tester',
          isPublicDomain: true,
          period: ['Modern'],
          styles: ['Painting'],
          subjects: ['Test'],
          imageUrlFull: 'https://example.org/full.jpg',
          imageUrl1080: 'https://example.org/feed.jpg',
          embedding: [1, 0, 0],
          embeddingModel: 'clip-vit-b32',
        },
      ],
    };

    const server = app.getHttpServer() as Server;
    const firstResponse = await request(server)
      .post('/v1/internal/ingestion/batch')
      .set('x-ingestion-key', API_KEY)
      .send(payload);

    expect(firstResponse.status).toBe(201);
    expect(firstResponse.body).toMatchObject({ status: 'ok', created: 1, updated: 0, total: 1 });

    const artwork = await artworksService.findBySourceIdentifier('met', '12345');
    expect(artwork).toBeTruthy();
    expect(artwork?.embedding?.embedding).toEqual([1, 0, 0]);

    const secondResponse = await request(server)
      .post('/v1/internal/ingestion/batch')
      .set('x-ingestion-key', API_KEY)
      .send(payload);

    expect(secondResponse.status).toBe(201);
    expect(secondResponse.body).toMatchObject({ status: 'ok', created: 0, updated: 1, total: 1 });
    const refreshed = await artworksService.findBySourceIdentifier('met', '12345');
    expect(refreshed).toBeTruthy();
    expect(refreshed?.embedding?.embedding).toEqual([1, 0, 0]);
  });
});
