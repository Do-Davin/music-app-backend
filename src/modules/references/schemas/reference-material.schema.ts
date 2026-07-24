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
    enum: ['PDF', 'PPT', 'Sheet Music', 'Note', 'Doc', 'Other'],
  })
  type: string;

  @Field({ nullable: true })
  @Prop()
  description?: string;

  /**
   * Cloudinary public_id — used to build transformation URLs and to delete
   * the asset when the reference material is updated or removed.
   * e.g. "music-app/references/1719130000000-report"
   */
  @Field({ nullable: true })
  @Prop()
  filePath?: string;

  /**
   * The Cloudinary resource_type ('image', 'video', 'raw') returned after
   * upload. Stored so we can pass the correct type when deleting the asset.
   */
  @Field({ nullable: true })
  @Prop()
  cloudinaryResourceType?: string;

  /**
   * The Cloudinary secure_url returned after upload.
   * Stored directly so consumers can use it without rebuilding anything.
   */
  @Field(() => String, { nullable: true })
  @Prop()
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

