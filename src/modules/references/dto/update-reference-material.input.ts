import { InputType } from '@nestjs/graphql';
import { PartialType } from '@nestjs/graphql';
import { CreateReferenceMaterialInput } from './create-reference-material.input';

@InputType()
export class UpdateReferenceMaterialInput extends PartialType(
  CreateReferenceMaterialInput,
) {}