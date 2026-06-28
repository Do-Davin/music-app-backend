import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ThrottlerModule } from '@nestjs/throttler';
import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from './modules/auth/guards/gql-throttler.guard';
import { join } from 'path';
import { AppResolver } from './app.resolver';
import { PlaylistsModule } from './modules/playlists/playlists.module';
import { UsersModule } from './modules/users/users.module';
import { SongsModule } from './modules/songs/songs.module';
import { AuthModule } from './modules/auth/auth.module';
import { mongoModuleAsyncOptions } from './config/mongodb.config';
import { ReferencesModule } from './modules/references/references.module';
import { KaraokeModule } from './modules/karaoke/karaoke.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    MongooseModule.forRootAsync(mongoModuleAsyncOptions),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        return {
          throttlers: [
            {
              name: 'default',
              ttl: 60000, // 60 seconds window
              limit: 120, // max 120 requests per window (global safety net)
            },
          ],
          storage: redisUrl ? new ThrottlerStorageRedisService(redisUrl) : undefined,
        };
      },
    }),
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      csrfPrevention: false,
      context: ({ req, res }: { req: unknown; res: unknown }) => ({
        req,
        res,
      }),
    }),
    SongsModule,
    PlaylistsModule,
    UsersModule,
    AuthModule,
    ReferencesModule,
    KaraokeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    AppResolver,
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}

