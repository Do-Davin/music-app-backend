import { Field, Float, InputType } from '@nestjs/graphql';
import { KaraokeSongSource } from '../schemas/karaoke-song.schema';

@InputType()
export class KaraokeLyricWordInput {
  @Field(() => Float)
  timestamp: number;

  @Field()
  text: string;
}

@InputType()
export class KaraokeLyricLineInput {
  @Field(() => Float)
  timestamp: number;

  @Field()
  text: string;

  @Field(() => [KaraokeLyricWordInput], { nullable: true })
  words?: KaraokeLyricWordInput[];
}

@InputType()
export class CreateKaraokeSongInput {
  @Field()
  title: string;

  @Field({ nullable: true })
  artist: string;

  @Field(() => KaraokeSongSource)
  source: KaraokeSongSource;

  @Field()
  sourcePath: string;

  @Field(() => [KaraokeLyricLineInput], { nullable: true })
  lyrics: KaraokeLyricLineInput[];

  @Field(() => Float, { nullable: true })
  duration: number;
}
