import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SongsModule } from '../songs/songs.module';
import { Playlist, PlaylistSchema } from './schemas/playlist.schema';
import { PlaylistsService } from './playlists.service';
import { PlaylistsResolver } from './playlists.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Playlist.name, schema: PlaylistSchema },
    ]),
    SongsModule,
  ],
  providers: [PlaylistsService, PlaylistsResolver],
  exports: [PlaylistsService],
})
export class PlaylistsModule {}
