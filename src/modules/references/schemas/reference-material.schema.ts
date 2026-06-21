import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as mongoose from 'mongoose';

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
    enum: ['PDF', 'PPT', 'PTT', 'Sheet Music', 'Note', 'Doc', 'Other'],
  })
  type: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  @Field({ nullable: true })
  @Prop()
  filePath?: string;

  @Field(() => String, { nullable: true })
  fileUrl?: string;

  @Field({ nullable: true })
  @Prop()
  fileName?: string;

  @Field({ nullable: true })
  @Prop()
  fileSize?: number;

  @Field({ nullable: true })
  @Prop()
  mimeType?: string;

  // Store the file binary content directly in MongoDB
  @Prop({ type: mongoose.Schema.Types.Buffer })
  fileData?: Buffer;

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

export const ReferenceMaterialSchema =
  SchemaFactory.createForClass(ReferenceMaterial);

// Build fileUrl pointing to the REST download endpoint
ReferenceMaterialSchema.virtual('fileUrl').get(function () {
  const doc = this as ReferenceMaterialDocument;
  // Only generate a download URL if we have file data stored in the database
  if (!doc.fileData && !doc.filePath) return null;
  const base = process.env.BASE_URL || 'http://localhost:3000';
  return `${base}/references/${doc._id}/download`;
});

// Ensure virtuals are included in JSON/Object conversions
ReferenceMaterialSchema.set('toJSON', { virtuals: true });
ReferenceMaterialSchema.set('toObject', { virtuals: true });
