import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ArtworkEmbedding } from './artwork_embedding.entity';

@Entity({ name: 'artworks' })
@Index(['source', 'sourceId'], { unique: true })
export class Artwork {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'text' })
  source!: string;

  @Column({ type: 'text', name: 'source_id' })
  sourceId!: string;

  @Column({ type: 'text', nullable: true })
  title?: string;

  @Column({ type: 'text', nullable: true })
  artist?: string;

  @Column({ type: 'text', name: 'artist_id', nullable: true })
  artistId?: string;

  @Column({ type: 'text', name: 'date_display', nullable: true })
  dateDisplay?: string;

  @Column({ type: 'text', nullable: true })
  medium?: string;

  @Column({ type: 'simple-array', nullable: true })
  period?: string[];

  @Column({ type: 'simple-array', nullable: true })
  styles?: string[];

  @Column({ type: 'simple-array', nullable: true })
  subjects?: string[];

  @Column({ type: 'text', name: 'iiif_manifest_url', nullable: true })
  iiifManifestUrl?: string;

  @Column({ type: 'text', name: 'iiif_image_base', nullable: true })
  iiifImageBase?: string;

  @Column({ type: 'text', name: 'image_url_full', nullable: true })
  imageUrlFull?: string;

  @Column({ type: 'text', name: 'image_url_1080', nullable: true })
  imageUrl1080?: string;

  @Column({ type: 'integer', nullable: true })
  width?: number;

  @Column({ type: 'integer', nullable: true })
  height?: number;

  @Column({ type: 'text', nullable: true })
  license?: string;

  @Column({ type: 'text', nullable: true })
  rights?: string;

  @Column({ type: 'text', name: 'credit_line', nullable: true })
  creditLine?: string;

  @Column({ type: 'boolean', name: 'is_public_domain', default: false })
  isPublicDomain!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToOne(() => ArtworkEmbedding, (embedding) => embedding.artwork)
  embedding?: ArtworkEmbedding;
}
