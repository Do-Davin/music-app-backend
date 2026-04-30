import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateReferenceMaterialInput {
  @Field()
  title: string;

  @Field()
  type: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  fileUrl?: string;

  @Field({ nullable: true })
  songId?: string;

  @Field({ nullable: true })
  topic?: string;
}