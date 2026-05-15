<<<<<<< HEAD
import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Playlist } from './schemas/playlist.schema';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Song } from '../songs/schemas/song.schema';
import { SongsService } from '../songs/songs.service';
=======
import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Playlist } from './schemas/playlist.schema';
import { PlaylistsService } from './playlists.service';
import { SongsService } from '../songs/songs.service';
import { Song } from '../songs/schemas/song.schema';
import { CreatePlaylistInput } from './dto/create-playlist.input';
import { UpdatePlaylistInput } from './dto/update-playlist.input';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
>>>>>>> 047c594fedd01f975aa8e04442359535d83cd7f3

@Resolver(() => Playlist)
export class PlaylistsResolver {
  constructor(
    private readonly playlistsService: PlaylistsService,
    private readonly songsService: SongsService,
  ) {}

  @Query(() => [Playlist], { name: 'playlists' })
  async findAll(): Promise<Playlist[]> {
    return this.playlistsService.findAll();
  }

  @Query(() => [Playlist], { name: 'myPlaylists' })
  @UseGuards(JwtAuthGuard)
  async findMyPlaylists(@CurrentUser('userId') userId: string): Promise<Playlist[]> {
    return this.playlistsService.findByUser(userId);
  }

  @Query(() => Playlist, { name: 'playlist' })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Playlist> {
    return this.playlistsService.findOne(id);
  }

<<<<<<< HEAD
  @Query(() => Playlist, { name: 'likedSongsPlaylist' })
  @UseGuards(JwtAuthGuard)
  async likedSongsPlaylist(
    @CurrentUser('userId') userId: string,
  ): Promise<Playlist> {
    return this.playlistsService.findOrCreateLikedSongsPlaylist(userId);
  }

  @ResolveField(() => [Song], { name: 'songs', nullable: true })
  async songs(@Parent() playlist: Playlist): Promise<Song[]> {
    const ids = playlist.songIds ?? [];
    return this.songsService.findManyByIds(ids);
=======
  @Mutation(() => Playlist)
  @UseGuards(JwtAuthGuard)
  async createPlaylist(
    @CurrentUser('userId') userId: string,
    @Args('createPlaylistInput') createPlaylistInput: CreatePlaylistInput,
  ): Promise<Playlist> {
    return this.playlistsService.create(userId, createPlaylistInput);
  }

  @Mutation(() => Playlist)
  @UseGuards(JwtAuthGuard)
  async updatePlaylist(
    @CurrentUser('userId') userId: string,
    @Args('updatePlaylistInput') updatePlaylistInput: UpdatePlaylistInput,
  ): Promise<Playlist> {
    return this.playlistsService.update(userId, updatePlaylistInput);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removePlaylist(
    @CurrentUser('userId') userId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.playlistsService.remove(userId, id);
  }

  @Mutation(() => Playlist)
  @UseGuards(JwtAuthGuard)
  async addSongToPlaylist(
    @CurrentUser('userId') userId: string,
    @Args('playlistId', { type: () => ID }) playlistId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<Playlist> {
    return this.playlistsService.addSong(userId, playlistId, songId);
  }

  @Mutation(() => Playlist)
  @UseGuards(JwtAuthGuard)
  async removeSongFromPlaylist(
    @CurrentUser('userId') userId: string,
    @Args('playlistId', { type: () => ID }) playlistId: string,
    @Args('songId', { type: () => ID }) songId: string,
  ): Promise<Playlist> {
    return this.playlistsService.removeSong(userId, playlistId, songId);
  }

  @ResolveField(() => [Song], { name: 'songs' })
  async getSongs(@Parent() playlist: Playlist): Promise<Song[]> {
    const { songIds } = playlist;
    if (!songIds || songIds.length === 0) {
      return [];
    }
    return this.songsService.findManyByIds(songIds.map(id => id.toString()));
>>>>>>> 047c594fedd01f975aa8e04442359535d83cd7f3
  }
}
