import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { AppResolver } from './app.resolver';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { UsersModule } from './modules/users/users.module';
import { SongsModule } from './modules/songs/songs.module';
import { AuthModule } from './modules/auth/auth.module';
import { PracticeSessionsModule } from './modules/practice-sessions/practice-sessions.module';
import { mongoModuleAsyncOptions } from './config/mongodb.config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync(mongoModuleAsyncOptions),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
    }),
    SongsModule,
    PlaylistsModule,
    UsersModule,
    AuthModule,
    PracticeSessionsModule,
  ],
  controllers: [AppController],
  providers: [AppService, AppResolver],
})
export class AppModule {}
