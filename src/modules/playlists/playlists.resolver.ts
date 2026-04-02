import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { Playlist } from './schemas/playlist.schema';
import { PlaylistsService } from './playlists.service';

@Resolver(() => Playlist)
export class PlaylistsResolver {
  constructor(private readonly playlistsService: PlaylistsService) {}

  @Query(() => [Playlist], { name: 'playlists' })
  async findAll(): Promise<Playlist[]> {
    return this.playlistsService.findAll();
  }

  @Query(() => Playlist, { name: 'playlist' })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Playlist> {
    return this.playlistsService.findOne(id);
  }
}
