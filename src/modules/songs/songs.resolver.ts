import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { Song } from './schemas/song.schema';
import { SongsService } from './songs.service';
import { CreateSongInput } from './dto/create-song.input';
import { UpdateSongInput } from './dto/update-song.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@Resolver(() => Song)
export class SongsResolver {
  constructor(private readonly songsService: SongsService) {}

  // ── Queries ──────────────────────────────────────────────────────────────

  @Query(() => [Song], { name: 'songs' })
  async findAll(): Promise<Song[]> {
    return this.songsService.findAll();
  }

  @Query(() => Song, { name: 'song' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<Song> {
    return this.songsService.findOne(id);
  }

  @Query(() => [Song], { name: 'mySongs' })
  @UseGuards(JwtAuthGuard)
  async findMySongs(@CurrentUser() user: User): Promise<Song[]> {
    return this.songsService.findByUser(user._id.toString());
  }

  // ── Mutations ─────────────────────────────────────────────────────────────

  /**
   * Create a song with either an mp3 file URL or a YouTube link.
   *
   * MP3 example:
   *   mutation {
   *     createSong(createSongInput: {
   *       title: "My Song"
   *       artist: "Artist Name"
   *       source: mp3
   *       sourcePath: "/uploads/songs/my-song.mp3"
   *     }) { _id title source sourcePath }
   *   }
   *
   * YouTube example:
   *   mutation {
   *     createSong(createSongInput: {
   *       title: "Wonderwall"
   *       artist: "Oasis"
   *       source: youtube
   *       sourcePath: "https://www.youtube.com/watch?v=6hzrDeceEKc"
   *     }) { _id title source sourcePath }
   *   }
   */
  @Mutation(() => Song)
  @UseGuards(JwtAuthGuard)
  async createSong(
    @CurrentUser('userId') userId: string,
    @Args('createSongInput') createSongInput: CreateSongInput,
  ): Promise<Song> {
    return this.songsService.create(userId, createSongInput);
  }

  /**
   * Update any fields of an existing song (all fields optional).
   *
   * Example – change source to YouTube:
   *   mutation {
   *     updateSong(
   *       id: "664abc123..."
   *       updateSongInput: { source: youtube, sourcePath: "https://youtu.be/xxx" }
   *     ) { _id title source sourcePath }
   *   }
   */
  @Mutation(() => Song)
  @UseGuards(JwtAuthGuard)
  async updateSong(
    @CurrentUser() user: User,
    @Args('updateSongInput') updateSongInput: UpdateSongInput,
  ): Promise<Song> {
    return this.songsService.update(user._id.toString(), updateSongInput);
  }

  /**
   * Delete a song by ID.
   *
   * Example:
   *   mutation {
   *     removeSong(id: "664abc123...")
   *   }
   */
  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeSong(
    @CurrentUser() user: User,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.songsService.remove(user._id.toString(), id);
  }
}
