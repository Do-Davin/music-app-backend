import { UseGuards } from '@nestjs/common';
import {
  Args,
  ID,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Song } from '../songs/schemas/song.schema';
import { SongsService } from '../songs/songs.service';
import { CreatePlaylistInput } from './dto/create-playlist.input';
import { UpdatePlaylistInput } from './dto/update-playlist.input';
import { PlaylistsService } from './playlists.service';
import { Playlist } from './schemas/playlist.schema';

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
  async findMyPlaylists(
    @CurrentUser('userId') userId: string,
  ): Promise<Playlist[]> {
    return this.playlistsService.findByUser(userId);
  }

  @Query(() => Playlist, { name: 'playlist' })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Playlist> {
    return this.playlistsService.findOne(id);
  }

  @Query(() => Playlist, { name: 'likedSongsPlaylist' })
  @UseGuards(JwtAuthGuard)
  async likedSongsPlaylist(
    @CurrentUser('userId') userId: string,
  ): Promise<Playlist> {
    return this.playlistsService.findOrCreateLikedSongsPlaylist(userId);
  }

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

  @ResolveField(() => [Song], { name: 'songs', nullable: true })
  async songs(@Parent() playlist: Playlist): Promise<Song[]> {
    return this.songsService.findManyByIds(playlist.songIds ?? []);
  }
}
