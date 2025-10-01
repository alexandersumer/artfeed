import { Controller, Get, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { FeedService } from './feed.service';
import { FeedRequestDto } from './dto/feed-request.dto';

@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(@Query() query: FeedRequestDto, @Req() req: Request) {
    const count = query.count ?? undefined;
    const userId = req.header('x-user-id') || undefined;
    const { cards, nextCursor } = await this.feedService.getFeed(userId, count);
    return { cards, nextCursor };
  }
}
