import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class VerifyOtpInput {
  @Field()
  email: string;

  @Field()
  otpCode: string;
}