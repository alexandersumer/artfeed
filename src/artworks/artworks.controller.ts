import { Controller, Get, NotFoundException, Param, ParseIntPipe } from '@nestjs/common';
import { ArtworksService } from './artworks.service';

@Controller('artworks')
export class ArtworksController {
  constructor(private readonly artworksService: ArtworksService) {}

  @Get(':id')
  async getArtwork(@Param('id', ParseIntPipe) id: number) {
    const artwork = await this.artworksService.findById(id);
    if (!artwork) {
      throw new NotFoundException('Artwork not found');
    }
    return artwork;
  }
}
