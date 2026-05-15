import { UseGuards } from '@nestjs/common';
import { Args, ID, Int, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PlaylistsService } from '../playlists/playlists.service';
import { Song } from '../songs/schemas/song.schema';
import { SongsService } from '../songs/songs.service';
import { RecentlyPlayedSong } from './schemas/recently-played.schema';
import { User } from './schemas/user.schema';
import { UsersService, type UserWithoutPassword } from './users.service';

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
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<UserWithoutPassword[]> {
    return this.usersService.getFriends(userId, limit, offset);
  }

  @Query(() => [User], { name: 'incomingFriendRequests' })
  @UseGuards(JwtAuthGuard)
  async getIncomingFriendRequests(
    @CurrentUser('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<UserWithoutPassword[]> {
    return this.usersService.getIncomingFriendRequests(userId, limit, offset);
  }

  @Query(() => [User], { name: 'outgoingFriendRequests' })
  @UseGuards(JwtAuthGuard)
  async getOutgoingFriendRequests(
    @CurrentUser('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<UserWithoutPassword[]> {
    return this.usersService.getOutgoingFriendRequests(userId, limit, offset);
  }

  @Query(() => [Song], { name: 'likedSongs' })
  @UseGuards(JwtAuthGuard)
  async likedSongs(
    @CurrentUser('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
    @Args('offset', { type: () => Int, nullable: true }) offset?: number,
  ): Promise<Song[]> {
    const ids = await this.usersService.getLikedSongs(userId, limit, offset);
    return this.songsService.findManyByIds(ids);
  }

  @Query(() => [RecentlyPlayedSong], { name: 'recentlyPlayed' })
  @UseGuards(JwtAuthGuard)
  async recentlyPlayed(
    @CurrentUser('userId') userId: string,
    @Args('limit', { type: () => Int, nullable: true }) limit?: number,
  ): Promise<RecentlyPlayedSong[]> {
    const entries = await this.usersService.getRecentlyPlayed(userId, limit);
    const songs = await this.songsService.findManyByIds(
      entries.map((entry) => entry.songId),
    );
    const songsById = new Map(songs.map((song) => [String(song._id), song]));

    return entries
      .map((entry) => ({
        songId: entry.songId,
        playedAt: entry.playedAt,
        song: songsById.get(String(entry.songId)),
      }))
      .filter((entry): entry is RecentlyPlayedSong => Boolean(entry.song));
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

  @Mutation(() => Boolean, { name: 'likeSong' })
  @UseGuards(JwtAuthGuard)
  async likeSong(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<boolean> {
    await this.songsService.findOne(songId);
    await this.playlistsService.addSongToLikedSongsPlaylist(userId, songId);
    return this.usersService.addLikedSong(userId, songId);
  }

  @Mutation(() => Boolean, { name: 'unlikeSong' })
  @UseGuards(JwtAuthGuard)
  async unlikeSong(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<boolean> {
    await this.songsService.findOne(songId);
    await this.playlistsService.removeSongFromLikedSongsPlaylist(
      userId,
      songId,
    );
    return this.usersService.removeLikedSong(userId, songId);
  }

  @Mutation(() => Boolean, { name: 'toggleLikeSong' })
  @UseGuards(JwtAuthGuard)
  async toggleLikeSong(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<boolean> {
    await this.songsService.findOne(songId);

    const isLiked = await this.usersService.isSongLiked(userId, songId);
    if (isLiked) {
      await this.playlistsService.removeSongFromLikedSongsPlaylist(
        userId,
        songId,
      );
      return this.usersService.removeLikedSong(userId, songId);
    }

    await this.playlistsService.addSongToLikedSongsPlaylist(userId, songId);
    return this.usersService.addLikedSong(userId, songId);
  }

  @Mutation(() => Boolean, { name: 'addRecentlyPlayed' })
  @UseGuards(JwtAuthGuard)
  async addRecentlyPlayed(
    @CurrentUser('userId') userId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<boolean> {
    await this.songsService.findOne(songId);
    return this.usersService.addRecentlyPlayed(userId, songId);
  }
}
