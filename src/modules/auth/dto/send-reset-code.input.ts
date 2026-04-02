import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class SendResetCodeInput {
  @Field()
  email: string = '';
}
