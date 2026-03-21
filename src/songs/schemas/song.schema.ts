import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

  @Field(() => Int)
  @Prop({ required: true })
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

  @Field({ nullable: true })
  @Prop()
  fileUrl: string;

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

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

export type SongDocument = Song & Document;
export const SongSchema = SchemaFactory.createForClass(Song);
