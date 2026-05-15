import { registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

registerEnumType(FriendshipStatus, {
  name: 'FriendshipStatus',
});

@Schema({ timestamps: true })
export class Friendship {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  requesterId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  receiverId: Types.ObjectId;

  @Prop({
    enum: FriendshipStatus,
    required: true,
    default: FriendshipStatus.PENDING,
    index: true,
  })
  status: FriendshipStatus;

  @Prop({ required: true, unique: true })
  pairKey: string;

  createdAt: Date;
  updatedAt: Date;
}

export type FriendshipDocument = Friendship & Document;
export const FriendshipSchema = SchemaFactory.createForClass(Friendship);

FriendshipSchema.index({ requesterId: 1, receiverId: 1, status: 1 });
FriendshipSchema.index({ receiverId: 1, status: 1, createdAt: -1 });
FriendshipSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
