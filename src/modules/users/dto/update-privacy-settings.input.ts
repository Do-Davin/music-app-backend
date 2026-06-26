import { Field, InputType } from '@nestjs/graphql';
import { VisibilityType } from '../schemas/user.schema';

@InputType()
export class UpdatePrivacySettingsInput {
  @Field(() => VisibilityType, { nullable: true })
  songVisibility?: VisibilityType;

  @Field(() => VisibilityType, { nullable: true })
  playlistVisibility?: VisibilityType;

  @Field(() => VisibilityType, { nullable: true })
  likedSongVisibility?: VisibilityType;
}
