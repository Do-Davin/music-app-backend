import { ObjectType, Field, ID, Int, registerEnumType } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum FocusArea {
  GENERAL = 'GENERAL',
  KARAOKE = 'KARAOKE',
  VOCAL = 'VOCAL',
  TIMING = 'TIMING',
  LYRICS = 'LYRICS',
}

registerEnumType(FocusArea, { name: 'FocusArea' });

@ObjectType()
@Schema({ timestamps: true })
export class PracticeSession {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field(() => String)
  @Prop({ required: true })
  title: string;

  @Field(() => String)
  @Prop({ required: true })
  practiceDate: Date;

  @Field(() => Int)
  @Prop({ required: true })
  duration: number; // in minutes

  @Field(() => FocusArea)
  @Prop({
    required: true,
    enum: FocusArea,
    default: FocusArea.GENERAL,
  })
  focusArea: FocusArea;

  @Field({ nullable: true })
  @Prop()
  notes: string;

  @Field(() => Int)
  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

export type PracticeSessionDocument = PracticeSession & Document;
export const PracticeSessionSchema =
  SchemaFactory.createForClass(PracticeSession);
