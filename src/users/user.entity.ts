import {
  Column,
  CreateDateColumn,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserProfile } from './user_profile.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'text', nullable: true })
  locale?: string;

  @Column({ type: 'text', nullable: true })
  country?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @OneToOne(() => UserProfile, (profile) => profile.user)
  profile?: UserProfile;
}
