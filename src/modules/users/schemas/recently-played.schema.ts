import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Song } from '../../songs/schemas/song.schema';

@ObjectType()
export class RecentlyPlayedSong {
  @Field(() => ID)
  songId: Types.ObjectId;

  @Field()
  playedAt: Date;

  @Field(() => Song)
  song: Song;
}

@Schema()
export class RecentlyPlayed {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Song', required: true, index: true })
  songId: Types.ObjectId;

  @Prop({ required: true, default: Date.now, index: true })
  playedAt: Date;
}

export type RecentlyPlayedDocument = RecentlyPlayed & Document;
export const RecentlyPlayedSchema =
  SchemaFactory.createForClass(RecentlyPlayed);

RecentlyPlayedSchema.index({ userId: 1, playedAt: -1 });
