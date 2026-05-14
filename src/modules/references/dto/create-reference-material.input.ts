import { InputType, Field } from '@nestjs/graphql';
import GraphQLUpload from 'graphql-upload/GraphQLUpload.mjs';
import type { FileUpload } from 'graphql-upload/processRequest.mjs';

@InputType()
export class CreateReferenceMaterialInput {
  @Field()
  title: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  description?: string;

  @Field(() => GraphQLUpload, { nullable: true })
  file?: Promise<FileUpload>;

  @Field({ nullable: true })
  songId?: string;

  @Field({ nullable: true })
  topic?: string;
}