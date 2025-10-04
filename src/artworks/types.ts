import { Artwork } from './artwork.entity';
import { ArtworkEmbedding } from './artwork_embedding.entity';

export type ArtworkWithEmbedding = Artwork & { embedding?: ArtworkEmbedding };
