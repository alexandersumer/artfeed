import { Body, Controller, Post, Req } from '@nestjs/common';
import { Request } from 'express';
import { InteractionsService } from './interactions.service';
import { CreateInteractionDto } from './dto/create-interaction.dto';

@Controller('interaction')
export class InteractionsController {
  constructor(private readonly interactionsService: InteractionsService) {}

  @Post()
  async createInteraction(@Body() dto: CreateInteractionDto, @Req() req: Request) {
    const userId = req.header('x-user-id') || undefined;
    await this.interactionsService.recordInteraction(userId, dto);
    return { status: 'ok' };
  }
}
