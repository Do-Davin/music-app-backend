import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: 'user_liked_songs',
})
export class UserLikedSong {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Song', required: true, index: true })
  songId: Types.ObjectId;

  createdAt: Date;
}

export type UserLikedSongDocument = UserLikedSong & Document;
export const UserLikedSongSchema = SchemaFactory.createForClass(UserLikedSong);

UserLikedSongSchema.index({ userId: 1, songId: 1 }, { unique: true });
UserLikedSongSchema.index({ userId: 1, createdAt: -1 });
