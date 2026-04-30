import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@ObjectType()
@Schema({ timestamps: true, collection: 'reference_materials' })
export class ReferenceMaterial {
  @Field(() => ID, { name: 'id'})
  _id: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({
    required: true,
    enum: ['PDF', 'PPT', 'Sheet Music', 'Note', 'Other'],
  })
  type: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  @Field({ nullable: true })
  @Prop()
  fileUrl?: string;

  @Field({ nullable: true })
  @Prop()
  songId?: string;

  @Field({ nullable: true })
  @Prop()
  topic?: string;

  @Field({ nullable: true })
  createdAt: Date;

  @Field({ nullable: true })
  updatedAt: Date;
}

export type ReferenceMaterialDocument = ReferenceMaterial & Document;
export const ReferenceMaterialSchema =
  SchemaFactory.createForClass(ReferenceMaterial);