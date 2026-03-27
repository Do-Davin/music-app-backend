import { ObjectType, Field } from '@nestjs/graphql';
import { User } from '../../users/schemas/user.schema';

@ObjectType()
export class AuthResponse {
  @Field()
  accessToken: string;

  @Field(() => User)
  user: Omit<User, 'password'>;
}
