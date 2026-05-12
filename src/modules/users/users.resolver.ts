import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './schemas/user.schema';
import { UserWithoutPassword, UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('userId') userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

  @Query(() => [User], { name: 'searchUsers' })
  @UseGuards(JwtAuthGuard)
  async searchUsers(
    @Args('search') search: string,
  ): Promise<UserWithoutPassword[]> {
    return this.usersService.findUsersByUsernameOrEmail(search);
  }

  @Query(() => [User], { name: 'myFriends' })
  @UseGuards(JwtAuthGuard)
  async getMyFriends(
    @CurrentUser('userId') userId: string,
  ): Promise<UserWithoutPassword[]> {
    return this.usersService.getFriends(userId);
  }

  @Query(() => [User], { name: 'incomingFriendRequests' })
  @UseGuards(JwtAuthGuard)
  async getIncomingFriendRequests(
    @CurrentUser('userId') userId: string,
  ): Promise<UserWithoutPassword[]> {
    return this.usersService.getIncomingFriendRequests(userId);
  }

  @Query(() => [User], { name: 'outgoingFriendRequests' })
  @UseGuards(JwtAuthGuard)
  async getOutgoingFriendRequests(
    @CurrentUser('userId') userId: string,
  ): Promise<UserWithoutPassword[]> {
    return this.usersService.getOutgoingFriendRequests(userId);
  }

  @Mutation(() => Boolean, { name: 'sendFriendRequest' })
  @UseGuards(JwtAuthGuard)
  async sendFriendRequest(
    @CurrentUser('userId') currentUserId: string,
    @Args('userId', { type: () => ID }) targetUserId: string,
  ): Promise<boolean> {
    return this.usersService.sendFriendRequest(currentUserId, targetUserId);
  }

  @Mutation(() => Boolean, { name: 'acceptFriendRequest' })
  @UseGuards(JwtAuthGuard)
  async acceptFriendRequest(
    @CurrentUser('userId') currentUserId: string,
    @Args('userId', { type: () => ID }) requesterUserId: string,
  ): Promise<boolean> {
    return this.usersService.acceptFriendRequest(
      currentUserId,
      requesterUserId,
    );
  }

  @Mutation(() => Boolean, { name: 'rejectFriendRequest' })
  @UseGuards(JwtAuthGuard)
  async rejectFriendRequest(
    @CurrentUser('userId') currentUserId: string,
    @Args('userId', { type: () => ID }) requesterUserId: string,
  ): Promise<boolean> {
    return this.usersService.rejectFriendRequest(
      currentUserId,
      requesterUserId,
    );
  }

  @Mutation(() => Boolean, { name: 'cancelFriendRequest' })
  @UseGuards(JwtAuthGuard)
  async cancelFriendRequest(
    @CurrentUser('userId') currentUserId: string,
    @Args('userId', { type: () => ID }) targetUserId: string,
  ): Promise<boolean> {
    return this.usersService.cancelFriendRequest(currentUserId, targetUserId);
  }
}
