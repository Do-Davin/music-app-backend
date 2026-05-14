import { UseGuards } from '@nestjs/common';
<<<<<<< HEAD
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { User } from './schemas/user.schema';
import { UsersService, type UserWithoutPassword } from './users.service';
=======
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { User } from './schemas/user.schema';
import { UserWithoutPassword, UsersService } from './users.service';
>>>>>>> 047c594fedd01f975aa8e04442359535d83cd7f3
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Song } from '../songs/schemas/song.schema';
import { SongsService } from '../songs/songs.service';
import { PlaylistsService } from '../playlists/playlists.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly songsService: SongsService,
    private readonly playlistsService: PlaylistsService,
  ) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('userId') userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

<<<<<<< HEAD
  @Query(() => [Song], { name: 'likedSongs' })
  @UseGuards(JwtAuthGuard)
  async likedSongs(@CurrentUser('userId') userId: string): Promise<Song[]> {
    const ids = await this.usersService.getLikedSongs(userId);
    return this.songsService.findManyByIds(ids);
  }

  @Mutation(() => User, { name: 'likeSong' })
  @UseGuards(JwtAuthGuard)
  async likeSong(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<UserWithoutPassword> {
    await this.songsService.findOne(songId);
    await this.playlistsService.addSongToLikedSongsPlaylist(userId, songId);
    return this.usersService.addLikedSong(userId, songId);
  }

  @Mutation(() => User, { name: 'unlikeSong' })
  @UseGuards(JwtAuthGuard)
  async unlikeSong(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<UserWithoutPassword> {
    await this.songsService.findOne(songId);
    await this.playlistsService.removeSongFromLikedSongsPlaylist(userId, songId);
    return this.usersService.removeLikedSong(userId, songId);
  }

  @Mutation(() => User, { name: 'toggleLikeSong' })
  @UseGuards(JwtAuthGuard)
  async toggleLikeSong(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<UserWithoutPassword> {
    await this.songsService.findOne(songId);

    const isLiked = await this.usersService.isSongLiked(userId, songId);
    if (isLiked) {
      await this.playlistsService.removeSongFromLikedSongsPlaylist(userId, songId);
    } else {
      await this.playlistsService.addSongToLikedSongsPlaylist(userId, songId);
    }
    return isLiked
      ? this.usersService.removeLikedSong(userId, songId)
      : this.usersService.addLikedSong(userId, songId);
=======
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
>>>>>>> 047c594fedd01f975aa8e04442359535d83cd7f3
  }
}
