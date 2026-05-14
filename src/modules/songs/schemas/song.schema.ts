import {
  ObjectType,
  Field,
  ID,
  Int,
  registerEnumType,
} from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum SongSource {
  mp3 = 'mp3',
  youtube = 'youtube',
}

registerEnumType(SongSource, {
  name: 'SongSource',
  description: 'The source type of the song audio',
});

@ObjectType()
@Schema({ timestamps: true })
export class Song {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({ required: true })
  artist: string;

  @Field({ nullable: true })
  @Prop()
  albumName: string;

  @Field(() => Int, { nullable: true })
  @Prop()
  duration: number;

  @Field({ nullable: true })
  @Prop()
  key: string;

  @Field(() => Int, { nullable: true })
  @Prop()
  tempo: number;

  @Field({ nullable: true })
  @Prop()
  difficulty: string;

  @Field(() => [String], { nullable: true })
  @Prop({ type: [String] })
  tags: string[];

  /**
   * How the audio is provided: 'mp3' (uploaded file URL) or 'youtube' (YouTube link).
   */
  @Field(() => SongSource, { nullable: true })
  @Prop({ enum: SongSource })
  source: SongSource;

  /**
   * For 'mp3': the stored file URL (e.g. /uploads/songs/my-song.mp3).
   * For 'youtube': the full YouTube URL or video ID.
   */
  @Field({ nullable: true })
  @Prop()
  sourcePath: string;

  /** Legacy – keep for backward compat, prefer sourcePath for mp3 uploads */
  @Field({ nullable: true })
  @Prop()
  fileUrl: string;

  /** Legacy – keep for backward compat, prefer sourcePath for youtube */
  @Field({ nullable: true })
  @Prop()
  videoUrl: string;

  @Field({ nullable: true })
  @Prop()
  coverImageUrl: string;

  @Field({ nullable: true })
  @Prop()
  lyrics: string;

  @Field({ nullable: true })
  @Prop()
  chordNotationStyle: string;

  @Field({ nullable: true, defaultValue: false })
  @Prop({ default: false })
  isPublic: boolean;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @Prop({ default: 0 })
  playCount: number;

  @Field({ nullable: true })
  @Prop()
  lastPlayedAt: Date;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

export type SongDocument = Song & Document;
export const SongSchema = SchemaFactory.createForClass(Song);
