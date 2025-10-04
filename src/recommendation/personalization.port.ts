import { ArtworkWithEmbedding } from '../artworks/types';
import { CreateInteractionDto } from '../interactions/dto/create-interaction.dto';

export interface RankOptions {
  modelVersion: string;
  freshnessHalfLifeDays?: number;
}

export interface RankedCandidate {
  artwork: ArtworkWithEmbedding;
  score: number;
}

export interface PersonalizationPort {
  rankCandidates(
    userEmbedding: number[] | undefined,
    candidates: ArtworkWithEmbedding[],
    options: RankOptions,
  ): RankedCandidate[];

  updateTasteFromInteraction(
    userId: string,
    artworkEmbedding: number[],
    dto: CreateInteractionDto,
  ): Promise<void>;
}

export const PERSONALIZATION_PORT = Symbol('PERSONALIZATION_PORT');
