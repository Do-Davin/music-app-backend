import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReferenceMaterialDocument = ReferenceMaterial & Document;

@ObjectType()
@Schema({ timestamps: true, collection: 'reference_materials' })
export class ReferenceMaterial {
  @Field(() => ID)
  _id: Types.ObjectId;

  @Field()
  @Prop({ required: true })
  title: string;

  @Field()
  @Prop({ 
    required: true, 
    enum: ['PDF', 'PPT', 'PTT', 'Sheet Music', 'Note', 'Doc', 'Other'] 
  })
  type: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  @Field({ nullable: true })
  @Prop()
  filePath?: string;

  @Field(() => String, { nullable: true })
  get fileUrl(): string | null {
    return this.filePath ? this.filePath : null;
  }

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

  @Field({ nullable: true })
  createdAt: Date;
  
  @Field({ nullable: true })
  updatedAt: Date;
}

export const ReferenceMaterialSchema = SchemaFactory.createForClass(ReferenceMaterial);