import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { FeedService } from "./feed.service";
import { FeedRequestDto } from "./dto/feed-request.dto";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CurrentUser } from "../auth/current-user.decorator";
import { AuthenticatedUser } from "../auth/auth-user.interface";

@Controller("feed")
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  async getFeed(
    @Query() query: FeedRequestDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const count = query.count ?? undefined;
    const { cards, nextCursor } = await this.feedService.getFeed(
      user.sub,
      count,
    );
    return { cards, nextCursor };
  }
}
