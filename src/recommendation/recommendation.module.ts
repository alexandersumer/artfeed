import { Module } from '@nestjs/common';
import { RecommendationService } from './recommendation.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [UsersModule],
  providers: [RecommendationService],
  exports: [RecommendationService],
})
export class RecommendationModule {}
