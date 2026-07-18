import { InputType, Field } from '@nestjs/graphql';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';
import { REFERENCE_MATERIAL_TYPES } from './create-reference-material.input';

@InputType()
export class UpdateReferenceMaterialInput {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsIn(REFERENCE_MATERIAL_TYPES, {
    message: `Type must be one of: ${REFERENCE_MATERIAL_TYPES.join(', ')}`,
  })
  type?: string;

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
