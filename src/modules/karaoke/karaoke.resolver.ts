import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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

  @Mutation(() => KaraokeSong)
  @UseGuards(JwtAuthGuard)
  async createKaraokeSong(
    @CurrentUser('userId') userId: string,
    @Args('input') input: CreateKaraokeSongInput,
  ): Promise<KaraokeSong> {
    return this.karaokeService.create(userId, input);
  }
}
