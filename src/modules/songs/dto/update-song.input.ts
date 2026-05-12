import { InputType, Field, Int, PartialType, ID } from '@nestjs/graphql';
import { CreateSongInput } from './create-song.input';

@InputType()
export class UpdateSongInput extends PartialType(CreateSongInput) {
  @Field(() => ID)
  id: string;
}
