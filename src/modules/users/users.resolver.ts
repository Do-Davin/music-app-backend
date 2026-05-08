import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { User } from './schemas/user.schema';
import { UsersService, type UserWithoutPassword } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Song } from '../songs/schemas/song.schema';
import { SongsService } from '../songs/songs.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(
    private readonly usersService: UsersService,
    private readonly songsService: SongsService,
  ) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser('userId') userId: string): Promise<User | null> {
    return this.usersService.findById(userId);
  }

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
    return this.usersService.addLikedSong(userId, songId);
  }

  @Mutation(() => User, { name: 'unlikeSong' })
  @UseGuards(JwtAuthGuard)
  async unlikeSong(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<UserWithoutPassword> {
    await this.songsService.findOne(songId);
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
    return isLiked
      ? this.usersService.removeLikedSong(userId, songId)
      : this.usersService.addLikedSong(userId, songId);
  }
}
