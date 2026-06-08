import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { ReferencesService } from './references.service';
import { ReferenceMaterial } from './schemas/reference-material.schema';
import { CreateReferenceMaterialInput } from './dto/create-reference-material.input';
import { UpdateReferenceMaterialInput } from './dto/update-reference-material.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Resolver(() => ReferenceMaterial)
export class ReferencesResolver {
  constructor(private readonly referencesService: ReferencesService) {}

  @Query(() => [ReferenceMaterial], { name: 'referenceMaterials' })
  async findAll(
    @Args('type', { type: () => String, nullable: true }) type?: string,
    @Args('songId', { type: () => String, nullable: true }) songId?: string,
  ): Promise<ReferenceMaterial[]> {
    return this.referencesService.findAll(type, songId);
  }

  @Query(() => ReferenceMaterial, { name: 'referenceMaterial' })
  async findOne(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<ReferenceMaterial> {
    return this.referencesService.findOne(id);
  }

  @Mutation(() => ReferenceMaterial)
  @UseGuards(JwtAuthGuard)
  async createReferenceMaterial(
    @CurrentUser('userId') userId: string,
    @Args('input') input: CreateReferenceMaterialInput,
  ): Promise<ReferenceMaterial> {
    return this.referencesService.create(userId, input);
  }

  @Mutation(() => ReferenceMaterial)
  @UseGuards(JwtAuthGuard)
  async updateReferenceMaterial(
    @CurrentUser('userId') userId: string,
    @Args('id', { type: () => ID }) id: string,
    @Args('input') input: UpdateReferenceMaterialInput,
  ): Promise<ReferenceMaterial> {
    return this.referencesService.update(userId, id, input);
  }

  @Mutation(() => Boolean)
  @UseGuards(JwtAuthGuard)
  async deleteReferenceMaterial(
    @CurrentUser('userId') userId: string,
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.referencesService.delete(userId, id);
  }
}
