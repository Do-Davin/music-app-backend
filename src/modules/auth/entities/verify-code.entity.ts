import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class VerifyCodeResponse {
  @Field()
  valid: boolean;

  @Field()
  message: string;
}
