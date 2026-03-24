import { Resolver, Query } from '@nestjs/graphql';
import { User } from './schemas/user.schema';

@Resolver(() => User)
export class UsersResolver {
  @Query(() => User, { name: 'me' })
  getMe(): User {
    return {
      _id: '507f1f77bcf86cd799439011',
      username: 'davin_musician',
      email: 'davin@musicapp.com',
      profileImageUrl: undefined,
      practiceGoals_dailyMinutes: 30,
      practiceGoals_weeklyDays: 5,
      practiceStreak_currentStreak: 7,
      practiceStreak_longestStreak: 14,
    };
  }
}
