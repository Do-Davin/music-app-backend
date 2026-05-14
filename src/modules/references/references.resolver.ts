import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ReferencesService } from './references.service';
import { ReferenceMaterial } from './schemas/reference-material.schema';
import { CreateReferenceMaterialInput } from './dto/create-reference-material.input';
import { UpdateReferenceMaterialInput } from './dto/update-reference-material.input';

@Resolver(() => ReferenceMaterial)
export class ReferencesResolver {
  constructor(private readonly referencesService: ReferencesService) {}

  @Query(() => [ReferenceMaterial], { name: 'referenceMaterials' })
  async findAll(
    @Args('type', { type: () => String, nullable: true }) type?: string,
  ): Promise<ReferenceMaterial[]> {
    return this.referencesService.findAll(type);
  }

  @Query(() => ReferenceMaterial, { name: 'referenceMaterial' })
  async findOne(@Args('id', { type: () => ID }) id: string): Promise<ReferenceMaterial> {
    return this.referencesService.findOne(id);
  }

  @Mutation(() => ReferenceMaterial)
  async createReferenceMaterial(
    @Args('input') input: CreateReferenceMaterialInput,
  ): Promise<ReferenceMaterial> {
    return this.referencesService.create(input);
  }

  @Mutation(() => ReferenceMaterial)
  async updateReferenceMaterial(
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateReferenceMaterialInput,
  ): Promise<ReferenceMaterial> {
    return this.referencesService.update(id, input);
  }

  @Mutation(() => Boolean)
  async deleteReferenceMaterial(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.referencesService.delete(id);
  }
}