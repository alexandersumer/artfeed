import { Injectable } from "@nestjs/common";
import { RecommendationService } from "../recommendation.service";
import {
  PersonalizationPort,
  RankOptions,
  RankedCandidate,
} from "../personalization.port";
import { ArtworkWithEmbedding } from "../../artworks/types";
import { CreateInteractionDto } from "../../interactions/dto/create-interaction.dto";

@Injectable()
export class DefaultPersonalizationAdapter implements PersonalizationPort {
  constructor(private readonly recommendationService: RecommendationService) {}

  rankCandidates(
    userEmbedding: number[] | undefined,
    candidates: ArtworkWithEmbedding[],
    options: RankOptions,
  ): RankedCandidate[] {
    return this.recommendationService.rankCandidates(
      userEmbedding,
      candidates,
      options,
    );
  }

  updateTasteFromInteraction(
    userId: string,
    artworkEmbedding: number[],
    dto: CreateInteractionDto,
  ): Promise<void> {
    return this.recommendationService.updateTasteFromInteraction(
      userId,
      artworkEmbedding,
      dto,
    );
  }
}
