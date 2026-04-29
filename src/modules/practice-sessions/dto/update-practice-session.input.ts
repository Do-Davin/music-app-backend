import { InputType, Field, Int } from '@nestjs/graphql';
import { FocusArea } from '../schemas/practice-session.schema';

@InputType()
export class UpdatePracticeSessionInput {
  @Field({ nullable: true })
  title?: string;

  @Field(() => Date, { nullable: true })
  practiceDate?: Date;

  @Field(() => Int, { nullable: true })
  duration?: number;

  @Field(() => FocusArea, { nullable: true })
  focusArea?: FocusArea;

  @Field({ nullable: true })
  notes?: string;

  @Field(() => Int, { nullable: true })
  rating?: number;
}
