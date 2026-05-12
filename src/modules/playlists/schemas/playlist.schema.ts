import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Song } from '../../songs/schemas/song.schema';

@ObjectType()
@Schema({ timestamps: true })
export class Playlist {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  name: string;

  @Field({ nullable: true })
  @Prop()
  description: string;

  @Field({ nullable: true })
  @Prop()
  coverImageUrl: string;

  @Field(() => [ID], { nullable: true })
  @Prop({ type: [Types.ObjectId], ref: 'Song' })
  songIds: Types.ObjectId[];

  @Field(() => [Song], { nullable: true })
  songs: Song[];

  @Field({ nullable: true, defaultValue: false })
  @Prop({ default: false })
  isPublic: boolean;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

export type PlaylistDocument = Playlist & Document;
export const PlaylistSchema = SchemaFactory.createForClass(Playlist);
