import { ObjectType, Field, ID, Int } from '@nestjs/graphql';

@ObjectType()
export class User {
  @Field(() => ID)
  _id: string;

  @Field()
  username: string;

  @Field()
  email: string;

  @Field({ nullable: true })
  profileImageUrl?: string;

  @Field(() => Int, { nullable: true })
  practiceGoals_dailyMinutes: number;

  @Field(() => Int, { nullable: true })
  practiceGoals_weeklyDays: number;

  @Field(() => Int, { nullable: true })
  practiceStreak_currentStreak: number;

  @Field(() => Int, { nullable: true })
  practiceStreak_longestStreak: number;
}
