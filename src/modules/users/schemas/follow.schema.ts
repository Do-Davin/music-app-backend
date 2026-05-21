import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@ObjectType()
export class FollowCounts {
  @Field(() => Int)
  followers: number;

  @Field(() => Int)
  following: number;
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Follow {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  followerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  followingId: Types.ObjectId;

  @Prop({ required: true, unique: true })
  pairKey: string;

  createdAt: Date;
}

export type FollowDocument = Follow & Document;
export const FollowSchema = SchemaFactory.createForClass(Follow);

FollowSchema.index({ followerId: 1, createdAt: -1 });
FollowSchema.index({ followingId: 1, createdAt: -1 });
