import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class VerifyCodeResponse {
  @Field()
  valid: boolean = false;

  @Field()
  message: string = '';
}
