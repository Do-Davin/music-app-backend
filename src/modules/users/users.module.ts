import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { Friendship, FriendshipSchema } from './schemas/friendship.schema';
import {
  RecentlyPlayed,
  RecentlyPlayedSchema,
} from './schemas/recently-played.schema';
import {
  UserLikedSong,
  UserLikedSongSchema,
} from './schemas/user-liked-song.schema';
import { UsersService } from './users.service';
import { UsersResolver } from './users.resolver';
import { SongsModule } from '../songs/songs.module';
import { PlaylistsModule } from '../playlists/playlists.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Friendship.name, schema: FriendshipSchema },
      { name: UserLikedSong.name, schema: UserLikedSongSchema },
      { name: RecentlyPlayed.name, schema: RecentlyPlayedSchema },
    ]),
    SongsModule,
    PlaylistsModule,
  ],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
})
export class UsersModule {}
