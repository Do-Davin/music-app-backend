import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class ResetCodeResponse {
  @Field()
  message: string;

  @Field()
  email: string;
}
