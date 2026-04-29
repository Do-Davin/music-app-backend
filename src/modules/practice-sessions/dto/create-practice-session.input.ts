import { InputType, Field, Int } from '@nestjs/graphql';
import { FocusArea } from '../schemas/practice-session.schema';

@InputType()
export class CreatePracticeSessionInput {
  @Field(() => String)
  title: string;

  @Field(() => Date)
  practiceDate: Date;

  @Field(() => Int)
  duration: number;

  @Field(() => FocusArea)
  focusArea: FocusArea;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Int)
  rating: number;
}
