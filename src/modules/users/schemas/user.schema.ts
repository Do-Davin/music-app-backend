import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

// Nested: PracticeStreak
@ObjectType()
@Schema({ _id: false })
export class PracticeStreak {
  @Field(() => Int, { nullable: true })
  @Prop({ default: 0 })
  currentStreak: number;

  @Field(() => Int, { nullable: true })
  @Prop({ default: 0 })
  longestStreak: number;

  @Field({ nullable: true })
  @Prop()
  lastPracticeDate?: Date;
}

// Nested: PracticeGoals
@ObjectType()
@Schema({ _id: false })
export class PracticeGoals {
  @Field(() => Int, { nullable: true })
  @Prop({ default: 30 })
  dailyMinutes: number;

  @Field(() => Int, { nullable: true })
  @Prop({ default: 5 })
  weeklyDays: number;
}

// Nested: Preferences
@ObjectType()
@Schema({ _id: false })
export class Preferences {
  @Field(() => Int, { nullable: true })
  @Prop({ default: 120 })
  defaultBpm: number;

  @Field(() => Int, { nullable: true })
  @Prop({ default: 440 })
  tuningHz: number;

  @Field({ nullable: true })
  @Prop()
  instrument?: string;
}

// Sub-document: RecentlyPlayed
@ObjectType()
@Schema({ _id: false })
export class RecentlyPlayed {
  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'Song', required: true })
  songId: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  playedAt: Date;
}

@ObjectType()
@Schema({ timestamps: true })
export class User {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  @Prop({ required: true, unique: true })
  username: string;

  @Field()
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Field({ nullable: true })
  @Prop()
  profileImageUrl?: string;

  @Field(() => [ID], { nullable: true })
  @Prop({ type: [Types.ObjectId], ref: 'Song', default: [] })
  likedSongIds: Types.ObjectId[];

  @Field(() => [RecentlyPlayed], { nullable: true })
  @Prop({
    type: [RecentlyPlayed],
    default: [],
    validate: {
      validator: (v: RecentlyPlayed[]) => v.length <= 20,
      message: 'Recently played list cannot exceed 20 items',
    },
  })
  recentlyPlayed: RecentlyPlayed[];

  @Field(() => PracticeGoals, { nullable: true })
  @Prop({ type: PracticeGoals, default: () => ({}) })
  practiceGoals: PracticeGoals;

  @Field(() => PracticeStreak, { nullable: true })
  @Prop({ type: PracticeStreak, default: () => ({}) })
  practiceStreak: PracticeStreak;

  @Field(() => Preferences, { nullable: true })
  @Prop({ type: Preferences, default: () => ({}) })
  preferences: Preferences;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);
