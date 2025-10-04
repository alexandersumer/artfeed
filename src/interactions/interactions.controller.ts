import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth-user.interface';

@Controller('interaction')
@UseGuards(JwtAuthGuard)
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createInteraction(@Body() dto: CreateInteractionDto, @CurrentUser() user: AuthenticatedUser) {
    await this.interactionsService.recordInteraction(user.sub, dto);
    return { status: 'ok' };
  }
}
