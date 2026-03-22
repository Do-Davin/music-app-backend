import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Song, SongSchema } from './schemas/song.schema';
import { SongsService } from './songs.service';
import { SongsResolver } from './songs.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Song.name, schema: SongSchema }]),
  ],
  providers: [SongsService, SongsResolver],
  exports: [SongsService],
})
export class SongsModule {}
