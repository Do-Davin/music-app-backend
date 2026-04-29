import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { PracticeSession } from './schemas/practice-session.schema';
import { PracticeSessionsService } from './practice-sessions.service';
import { CreatePracticeSessionInput } from './dto/create-practice-session.input';
import { UpdatePracticeSessionInput } from './dto/update-practice-session.input';

@Resolver(() => PracticeSession)
export class PracticeSessionsResolver {
  constructor(
    private readonly practiceSessionsService: PracticeSessionsService,
  ) {}

  @Query(() => [PracticeSession], { name: 'practiceSessions' })
  async findAll(): Promise<PracticeSession[]> {
    return this.practiceSessionsService.findAll();
  }

  @Query(() => PracticeSession, { name: 'practiceSession' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<PracticeSession> {
    return this.practiceSessionsService.findOne(id);
  }

  @Mutation(() => PracticeSession, { name: 'createPracticeSession' })
  async create(
    @Args('input') createPracticeSessionInput: CreatePracticeSessionInput,
  ): Promise<PracticeSession> {
    return this.practiceSessionsService.create(createPracticeSessionInput);
  }

  @Mutation(() => PracticeSession, { name: 'updatePracticeSession' })
  async update(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') updatePracticeSessionInput: UpdatePracticeSessionInput,
  ): Promise<PracticeSession> {
    return this.practiceSessionsService.update(id, updatePracticeSessionInput);
  }

  @Mutation(() => Boolean, { name: 'deletePracticeSession' })
  async delete(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.practiceSessionsService.delete(id);
  }
}
