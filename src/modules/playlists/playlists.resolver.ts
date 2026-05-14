import { UseGuards } from '@nestjs/common';
import { Resolver, Query, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { Playlist } from './schemas/playlist.schema';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Song } from '../songs/schemas/song.schema';
import { SongsService } from '../songs/songs.service';

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

  @ResolveField(() => [Song], { name: 'songs', nullable: true })
  async songs(@Parent() playlist: Playlist): Promise<Song[]> {
    const ids = playlist.songIds ?? [];
    return this.songsService.findManyByIds(ids);
  }
}
