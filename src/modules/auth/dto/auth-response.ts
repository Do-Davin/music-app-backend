import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/schemas/user.schema';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: User;
}

@ObjectType()
export class MessageResponse {
  @Field()
  message: string;

  @Field()
  success: boolean;
}