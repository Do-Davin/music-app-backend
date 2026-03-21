import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { Song } from './schemas/song.schema';
import { SongsService } from './songs.service';

@Resolver(() => Song)
export class SongsResolver {
  constructor(private readonly songsService: SongsService) {}

  @Query(() => [Song], { name: 'songs' })
  async findAll(): Promise<Song[]> {
    return this.songsService.findAll();
  }

  @Query(() => Song, { name: 'song' })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<Song> {
    return this.songsService.findOne(id);
  }
}
