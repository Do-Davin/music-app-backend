import { InputType, Field } from '@nestjs/graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';

@InputType()
export class UpdateReferenceMaterialInput {
  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  type?: string;

  @Field({ nullable: true })
  description?: string;

  // CHANGED: Allow file replacement
  @Field(() => GraphQLUpload, { nullable: true })
  file?: Promise<FileUpload>;

  @Field({ nullable: true })
  songId?: string;

  @Field({ nullable: true })
  topic?: string;
}