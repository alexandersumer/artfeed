import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Interaction } from './interaction.entity';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { ArtworksService } from '../artworks/artworks.service';
import { FeedImpression } from '../feed/feed_impression.entity';
import { UsersService } from '../users/users.service';
import { PERSONALIZATION_PORT, PersonalizationPort } from '../recommendation/personalization.port';

@Injectable()
export class InteractionsService {
  constructor(
    @InjectRepository(Interaction)
    private readonly interactionRepository: Repository<Interaction>,
    @InjectRepository(FeedImpression)
    private readonly impressionRepository: Repository<FeedImpression>,
    private readonly artworksService: ArtworksService,
    private readonly usersService: UsersService,
    @Inject(PERSONALIZATION_PORT)
    private readonly personalization: PersonalizationPort,
  ) {}

  async recordInteraction(userId: string, dto: CreateInteractionDto): Promise<void> {
    const artwork = await this.artworksService.findById(dto.artworkId);
    if (!artwork?.embedding) {
      throw new BadRequestException('Artwork missing embedding or not found');
    }

    const user = await this.usersService.ensureUser(userId);

    const entity = this.interactionRepository.create({
      artwork,
      user,
      eventType: dto.eventType,
      dwellMs: dto.dwellMs,
      scrollVelocity: dto.scrollVelocity,
      position: dto.position,
    });
    await this.interactionRepository.save(entity);

    await this.personalization.updateTasteFromInteraction(user.id, artwork.embedding.embedding, dto);
  }

  async recordImpressions(
    userId: string | undefined,
    impressions: Array<{ artworkId: number; rank: number; score: number; modelVersion?: string }>,
  ): Promise<void> {
    const user = await this.usersService.ensureUser(userId);
    const artworks = await Promise.all(
      impressions.map(async (imp) => {
        const artwork = await this.artworksService.findById(imp.artworkId);
        if (!artwork) {
          throw new BadRequestException(`Unknown artwork ${imp.artworkId}`);
        }
        return { artwork, data: imp };
      }),
    );

    const entities = artworks.map(({ artwork, data }) =>
      this.impressionRepository.create({
        artwork,
        user,
        rank: data.rank,
        score: data.score,
        modelVersion: data.modelVersion,
      }),
    );

    await this.impressionRepository.save(entities);
  }
}
