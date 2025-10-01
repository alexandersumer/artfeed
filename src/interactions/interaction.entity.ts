import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Artwork } from '../artworks/artwork.entity';

@Entity({ name: 'interactions' })
export class Interaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  user?: User;

  @ManyToOne(() => Artwork, { nullable: false, onDelete: 'CASCADE' })
  artwork!: Artwork;

  @Column({ type: 'text', name: 'event_type' })
  eventType!: string;

  @Column({ type: 'integer', name: 'dwell_ms', nullable: true })
  dwellMs?: number;

  @Column({ type: 'real', name: 'scroll_velocity', nullable: true })
  scrollVelocity?: number;

  @Column({ type: 'integer', nullable: true })
  position?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
