import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '../users/user.entity';
import { Artwork } from '../artworks/artwork.entity';

@Entity({ name: 'feed_impressions' })
export class FeedImpression {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @ManyToOne(() => Artwork, { nullable: false, onDelete: 'CASCADE' })
  artwork!: Artwork;

  @Column({ type: 'integer' })
  rank!: number;

  @Column({ type: 'real' })
  score!: number;

  @Column({ type: 'text', name: 'model_version', nullable: true })
  modelVersion?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
