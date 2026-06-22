import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { KaraokeSong } from './schemas/karaoke-song.schema';
import { KaraokeService } from './karaoke.service';
import { CreateKaraokeSongInput } from './dto/create-karaoke-song.input';

@Resolver()
export class KaraokeResolver {
  constructor(private readonly karaokeService: KaraokeService) {}

  @Query(() => String)
  karaokeHealth(): string {
    return this.karaokeService.getHealth();
  }

  @Query(() => [KaraokeSong], { name: 'karaokeSongs' })
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser('userId') userId: string): Promise<KaraokeSong[]> {
    return this.karaokeService.findByUser(userId);
  }

  @Query(() => [KaraokeSong], { name: 'publicKaraokeSongs' })
  async findPublic(): Promise<KaraokeSong[]> {
    return this.karaokeService.findPublic();
  }

  @Query(() => [KaraokeSong], { name: 'searchOwnKaraokeSongs' })
  @UseGuards(JwtAuthGuard)
  async searchOwn(
    @CurrentUser('userId') userId: string,
    @Args('query', { type: () => String }) query: string,
  ): Promise<KaraokeSong[]> {
    return this.karaokeService.searchOwn(userId, query);
  }

  @Query(() => [KaraokeSong], { name: 'searchPublicKaraokeSongs' })
  async searchPublic(
    @Args('query', { type: () => String }) query: string,
  ): Promise<KaraokeSong[]> {
    return this.karaokeService.searchPublic(query);
  }

  @Mutation(() => KaraokeSong)
  @UseGuards(JwtAuthGuard)
  async createKaraokeSong(
    @CurrentUser('userId') userId: string,
    @Args('input') input: CreateKaraokeSongInput,
  ): Promise<KaraokeSong> {
    return this.karaokeService.create(userId, input);
  }

  @Mutation(() => KaraokeSong)
  @UseGuards(JwtAuthGuard)
  async updateKaraokeSongVisibility(
    @CurrentUser('userId') userId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('isPublic', { type: () => Boolean }) isPublic: boolean,
  ): Promise<KaraokeSong> {
    return this.karaokeService.updateVisibility(userId, id, isPublic);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async removeKaraokeSong(
    @CurrentUser('userId') userId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.karaokeService.remove(userId, id);
  }
}
