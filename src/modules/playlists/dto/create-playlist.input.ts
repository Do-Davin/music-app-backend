import { InputType, Field, ID } from '@nestjs/graphql';

@InputType()
export class CreatePlaylistInput {
  @Field()
  name: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  coverImageUrl?: string;

  @Field({ nullable: true, defaultValue: false })
  isPublic?: boolean;

  @Field({ nullable: true, defaultValue: false })
  isKaraoke?: boolean;

  @Field(() => [ID], { nullable: true })
  songIds?: string[];
}
