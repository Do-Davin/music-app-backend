import { InputType, Field } from '@nestjs/graphql';
import { MinLength } from 'class-validator';

@InputType()
export class ResetPasswordInput {
  @Field()
  email: string;

  @Field()
  otpCode: string;

  @Field()
  @MinLength(8)
  newPassword: string;
}