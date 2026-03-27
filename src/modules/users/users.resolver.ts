import { Resolver, Query } from '@nestjs/graphql';
import { User } from './schemas/user.schema';
import { Types } from 'mongoose';

@Resolver(() => User)
export class UsersResolver {
  @Query(() => User, { name: 'me' })
  getMe(): User {
    return {
      _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
      username: 'davin_musician',
      email: 'davin@musicapp.com',
      password: 'hashed_password',
      profileImageUrl: undefined,
      likedSongIds: [],
      recentlyPlayed: [],
      practiceGoals: {
        dailyMinutes: 30,
        weeklyDays: 5,
      },
      practiceStreak: {
        currentStreak: 7,
        longestStreak: 14,
        lastPracticeDate: new Date('2026-03-26'),
      },
      preferences: {
        defaultBpm: 120,
        tuningHz: 440,
        instrument: 'guitar',
      },
      createdAt: new Date('2026-01-01'),
      updatedAt: new Date('2026-03-27'),
    } as User;
  }
}
