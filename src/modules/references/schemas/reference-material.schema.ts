import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ReferenceMaterialDocument = ReferenceMaterial & Document;

@ObjectType()
@Schema({ timestamps: true })
export class ReferenceMaterial {
  @Field(() => ID)
  _id: string;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({ 
    required: true, 
    enum: ['PDF', 'PPT', 'Sheet Music', 'Note', 'Other'] 
  })
  type: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  @Field({ nullable: true })
  @Prop()
  filePath?: string;

  @Field({ nullable: true })
  @Prop()
  fileName?: string;

  @Field({ nullable: true })
  @Prop()
  fileSize?: number;

  @Field({ nullable: true })
  @Prop()
  mimeType?: string;

  @Field({ nullable: true })
  @Prop()
  songId?: string;

  @Field({ nullable: true })
  @Prop()
  topic?: string;

  @Field()
  createdAt: Date;

  @Field()
  updatedAt: Date;
}

export const ReferenceMaterialSchema = SchemaFactory.createForClass(ReferenceMaterial);