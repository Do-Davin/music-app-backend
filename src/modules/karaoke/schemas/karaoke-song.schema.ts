import {
  Field,
  Float,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum KaraokeSongSource {
  youtube = 'youtube',
  local = 'local',
}

registerEnumType(KaraokeSongSource, {
  name: 'KaraokeSongSource',
});

@ObjectType()
@Schema({ _id: false })
export class KaraokeLyricLine {
  @Field(() => Float)
  @Prop({ required: true })
  timestamp: number;

  @Field()
  @Prop({ required: true })
  text: string;
}

export const KaraokeLyricLineSchema =
  SchemaFactory.createForClass(KaraokeLyricLine);

@ObjectType()
@Schema({ timestamps: true, collection: 'karaoke_songs' })
export class KaraokeSong {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => ID)
  @Prop({ required: true })
  userId: string;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field({ nullable: true })
  @Prop()
  artist: string;

  @Field(() => KaraokeSongSource)
  @Prop({ required: true, enum: KaraokeSongSource })
  source: KaraokeSongSource;

  @Field()
  @Prop({ required: true })
  sourcePath: string;

  @Field(() => [KaraokeLyricLine])
  @Prop({ type: [KaraokeLyricLineSchema], default: [] })
  lyrics: KaraokeLyricLine[];

  @Field(() => Float, { nullable: true })
  @Prop()
  duration: number;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

export type KaraokeSongDocument = KaraokeSong & Document;
export const KaraokeSongSchema = SchemaFactory.createForClass(KaraokeSong);
