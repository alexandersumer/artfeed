import { Injectable } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { CreateInteractionDto } from '../interactions/dto/create-interaction.dto';
import { Artwork } from '../artworks/artwork.entity';

interface RankOptions {
  modelVersion: string;
  freshnessHalfLifeDays?: number;
}

interface RankedCandidate {
  artwork: Artwork;
  score: number;
}

const DEFAULT_HALF_LIFE = 14; // days
const POSITIVE_EVENTS = new Set(['like', 'save', 'open']);
const NEGATIVE_EVENTS = new Set(['hide', 'skip']);

@Injectable()
export class RecommendationService {
  constructor(private readonly usersService: UsersService) {}

  rankCandidates(
    userEmbedding: number[] | undefined,
    candidates: Artwork[],
    options: RankOptions,
  ): RankedCandidate[] {
    const now = Date.now();
    const halfLifeMs = (options.freshnessHalfLifeDays ?? DEFAULT_HALF_LIFE) * 24 * 60 * 60 * 1000;

    const baseScores = candidates.map((artwork) => {
      const embedding = artwork.embedding?.embedding;
      const similarity = userEmbedding && embedding ? this.cosineSimilarity(userEmbedding, embedding) : 0;
      const freshnessScore = this.computeFreshnessBoost(now, new Date(artwork.createdAt).getTime(), halfLifeMs);
      const diversityPenalty = this.computeDiversityPenalty(artwork, candidates);
      const exploration = this.explorationBonus(artwork.id.toString());
      const blended = 0.65 * similarity + 0.15 * diversityPenalty + 0.1 * freshnessScore + 0.1 * exploration;
      return { artwork, score: blended };
    });

    return baseScores
      .sort((a, b) => b.score - a.score)
      .map((item) => ({ ...item, score: Number(item.score.toFixed(4)) }));
  }

  private computeFreshnessBoost(nowMs: number, createdMs: number, halfLifeMs: number): number {
    const age = nowMs - createdMs;
    if (age <= 0) {
      return 1;
    }
    const decay = Math.pow(0.5, age / halfLifeMs);
    return decay;
  }

  private computeDiversityPenalty(artwork: Artwork, candidates: Artwork[]): number {
    if (!artwork.artist) {
      return 0.5;
    }
    const sameArtistCount = candidates.filter((candidate) => candidate.artist === artwork.artist).length;
    return 1 / Math.max(1, sameArtistCount);
  }

  private explorationBonus(artworkId: string): number {
    let hash = 0;
    for (let i = 0; i < artworkId.length; i += 1) {
      hash = (hash * 31 + artworkId.charCodeAt(i)) % 1000;
    }
    return (hash % 100) / 100;
  }

  async updateTasteFromInteraction(userId: string, artworkEmbedding: number[], dto: CreateInteractionDto): Promise<void> {
    const profile = await this.usersService.getProfile(userId);
    const current = profile?.embedding ?? this.normalizeVector(Array.from({ length: artworkEmbedding.length }, () => 0));
    const alpha = 0.9;
    const weight = this.eventWeight(dto);
    if (weight === 0) {
      return;
    }

    const updated = current.map((value, index) => alpha * value + weight * artworkEmbedding[index]);
    const normalized = this.normalizeVector(updated);

    await this.usersService.upsertProfile(userId, normalized, new Date());
  }

  private eventWeight(dto: CreateInteractionDto): number {
    const dwellWeight = dto.dwellMs ? Math.min(1, dto.dwellMs / 3000) : 0;
    if (POSITIVE_EVENTS.has(dto.eventType)) {
      return 0.5 + dwellWeight;
    }
    if (NEGATIVE_EVENTS.has(dto.eventType)) {
      return -(0.3 + dwellWeight * 0.5);
    }
    if (dto.eventType === 'impression' && dwellWeight > 0.5) {
      return dwellWeight;
    }
    return 0;
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    const dot = a.reduce((sum, value, index) => sum + value * b[index], 0);
    const magA = Math.sqrt(a.reduce((sum, value) => sum + value * value, 0));
    const magB = Math.sqrt(b.reduce((sum, value) => sum + value * value, 0));
    if (magA === 0 || magB === 0) {
      return 0;
    }
    return dot / (magA * magB);
  }

  private normalizeVector(vector: number[]): number[] {
    const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
    if (magnitude === 0) {
      return vector;
    }
    return vector.map((value) => value / magnitude);
  }
}
