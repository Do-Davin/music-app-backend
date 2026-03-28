import { Resolver, Query } from '@nestjs/graphql';
import { User } from './schemas/user.schema';
import { UsersService, UserWithoutPassword } from './users.service';
import { NotFoundException, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async getMe(
    @CurrentUser('userId') userId: string,
  ): Promise<UserWithoutPassword> {
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
