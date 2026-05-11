import { InputType, Field, Int } from '@nestjs/graphql';
import { SongSource } from '../schemas/song.schema';

@InputType()
export class CreateSongInput {
  @Field()
  title: string;

  @Field()
  artist: string;

  @Field({ nullable: true })
  albumName?: string;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field({ nullable: true })
  key?: string;

  @Field(() => Int, { nullable: true })
  tempo?: number;

  @Field({ nullable: true })
  difficulty?: string;

  @Field(() => [String], { nullable: true })
  tags?: string[];

  /**
   * How the audio is provided.
   * - 'mp3'     → supply sourcePath as a file URL or server path
   * - 'youtube' → supply sourcePath as the YouTube URL / video ID
   */
  @Field(() => SongSource, { nullable: true })
  source?: SongSource;

  /**
   * Audio path/URL that matches the chosen source type.
   */
  @Field({ nullable: true })
  sourcePath?: string;

  /** @deprecated Use source + sourcePath instead */
  @Field({ nullable: true })
  fileUrl?: string;

  /** @deprecated Use source + sourcePath instead */
  @Field({ nullable: true })
  videoUrl?: string;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field({ nullable: true })
  lyrics?: string;

  @Field({ nullable: true })
  chordNotationStyle?: string;

  @Field({ nullable: true, defaultValue: false })
  isPublic?: boolean;
}
