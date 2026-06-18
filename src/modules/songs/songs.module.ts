import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Song, SongSchema } from './schemas/song.schema';
import {
  RecentlyPlayed,
  RecentlyPlayedSchema,
} from '../users/schemas/recently-played.schema';
import {
  UserLikedSong,
  UserLikedSongSchema,
} from '../users/schemas/user-liked-song.schema';
import { Playlist, PlaylistSchema } from '../playlists/schemas/playlist.schema';
import { SongsService } from './songs.service';
import { SongsResolver } from './songs.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Song.name, schema: SongSchema },
      { name: RecentlyPlayed.name, schema: RecentlyPlayedSchema },
      { name: UserLikedSong.name, schema: UserLikedSongSchema },
      { name: Playlist.name, schema: PlaylistSchema },
    ]),
  ],
  providers: [SongsService, SongsResolver],
  exports: [SongsService, MongooseModule],
})
export class SongsModule {}
