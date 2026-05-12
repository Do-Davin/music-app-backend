import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class RegisterInput {
  @Field({ nullable: true })
  username?: string;

  @Field()
  email: string;

  @Field()
  password: string;
}
