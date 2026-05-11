import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreatePlaylistInput } from './create-playlist.input';

@InputType()
export class UpdatePlaylistInput extends PartialType(CreatePlaylistInput) {
  @Field(() => ID)
  id: string;
}
