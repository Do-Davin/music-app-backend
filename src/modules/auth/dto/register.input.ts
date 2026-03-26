import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, MinLength, IsNotEmpty } from 'class-validator';

@InputType()
export class RegisterInput {
  @Field()
  @IsNotEmpty()
  fullName: string;

  @Field()
  @IsEmail()
  email: string;

  @Field()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;
}