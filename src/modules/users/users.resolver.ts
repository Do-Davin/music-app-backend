import { Resolver, Query } from '@nestjs/graphql';
import { User } from './schemas/user.schema';
import { UsersService, UserWithoutPassword } from './users.service';
import { NotFoundException } from '@nestjs/common';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  async getMe() // @CurrentUser('userId') userId: string
  : Promise<UserWithoutPassword> {
    // TODO: Remove mock ID once JWT auth is implemented
    const userId = '507f1f77bcf86cd799439011';

    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Strip password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...userWithoutPassword } = user.toObject() as User;
    return userWithoutPassword as UserWithoutPassword;
  }
}
