import { InputType, Field } from '@nestjs/graphql';
import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';

export const REFERENCE_MATERIAL_TYPES = [
  'PDF',
  'PPT',
  'Sheet Music',
  'Note',
  'Doc',
  'Other',
] as const;

@InputType()
export class CreateReferenceMaterialInput {
  @Field()
  @IsNotEmpty({ message: 'Title is required' })
  @IsString()
  @MaxLength(200)
  title: string;

  @Field()
  @IsNotEmpty({ message: 'Type is required' })
  @IsIn(REFERENCE_MATERIAL_TYPES, {
    message: `Type must be one of: ${REFERENCE_MATERIAL_TYPES.join(', ')}`,
  })
  type: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @Field(() => GraphQLUpload, { nullable: true })
  file?: Promise<FileUpload>;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  songId?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  topic?: string;
}
