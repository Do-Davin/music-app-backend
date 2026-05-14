import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KaraokeResolver } from './karaoke.resolver';
import { KaraokeService } from './karaoke.service';
import { KaraokeSong, KaraokeSongSchema } from './schemas/karaoke-song.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: KaraokeSong.name, schema: KaraokeSongSchema },
    ]),
  ],
  providers: [KaraokeService, KaraokeResolver],
})
export class KaraokeModule {}
