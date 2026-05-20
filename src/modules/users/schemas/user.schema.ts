import { Field, ID, Int, ObjectType, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ProfileType {
  PERSONAL = 'PERSONAL',
  PROFESSIONAL = 'PROFESSIONAL',
}

registerEnumType(ProfileType, {
  name: 'ProfileType',
});

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

@ObjectType()
@Schema({ timestamps: true })
export class User {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field({ nullable: true })
  @Prop({ unique: true, sparse: true })
  username?: string;

  @Field()
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  resetCode?: string;

  @Prop()
  resetCodeExpiry?: Date;

  @Field({ nullable: true })
  @Prop()
  profileImageUrl?: string;

  @Field(() => ProfileType)
  @Prop({
    enum: ProfileType,
    required: true,
    default: ProfileType.PERSONAL,
  })
  profileType: ProfileType;

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
