import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
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
  async findAll(): Promise<KaraokeSong[]> {
    return this.karaokeService.findAll();
  }

  @Mutation(() => KaraokeSong)
  async createKaraokeSong(
    @Args('input') input: CreateKaraokeSongInput,
  ): Promise<KaraokeSong> {
    return this.karaokeService.create(input);
  }
}
