import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UserProfile } from './user_profile.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(UserProfile)
    private readonly profileRepository: Repository<UserProfile>,
  ) {}

  async ensureUser(
    userId?: string,
    initial?: Partial<Pick<User, 'locale' | 'country'>>,
  ): Promise<User> {
    if (userId) {
      const existing = await this.userRepository.findOne({ where: { id: userId } });
      if (existing) {
        return existing;
      }
    }

    const created = this.userRepository.create(initial ?? {});
    return this.userRepository.save(created);
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return this.profileRepository.findOne({ where: { userId } });
  }

  async upsertProfile(userId: string, embedding: number[], now: Date): Promise<UserProfile> {
    const entity = this.profileRepository.create({ userId, embedding, lastUpdated: now });
    return this.profileRepository.save(entity);
  }
}
