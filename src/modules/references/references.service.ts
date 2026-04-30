import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReferenceMaterial,
  ReferenceMaterialDocument,
} from './schemas/reference-material.schema';
import { CreateReferenceMaterialInput } from './dto/create-reference-material.input';
import { UpdateReferenceMaterialInput } from './dto/update-reference-material.input';

@Injectable()
export class ReferencesService {
  constructor(
    @InjectModel(ReferenceMaterial.name)
    private referenceMaterialModel: Model<ReferenceMaterialDocument>,
  ) {}

  async findAll(type?: string): Promise<ReferenceMaterial[]> {
    const filter = type ? { type } : {};
    return this.referenceMaterialModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string): Promise<ReferenceMaterial> {
    const material = await this.referenceMaterialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Reference material with ID "${id}" not found`);
    }
    return material;
  }

  async create(
    input: CreateReferenceMaterialInput,
  ): Promise<ReferenceMaterial> {
    const newMaterial = new this.referenceMaterialModel(input);
    return newMaterial.save();
  }

  async update(
    id: string,
    input: UpdateReferenceMaterialInput,
  ): Promise<ReferenceMaterial> {
    const updated = await this.referenceMaterialModel
      .findByIdAndUpdate(id, input, { new: true })
      .exec();
    if (!updated) {
      throw new NotFoundException(`Reference material with ID "${id}" not found`);
    }
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.referenceMaterialModel
      .findByIdAndDelete(id)
      .exec();
    if (!result) {
      throw new NotFoundException(`Reference material with ID "${id}" not found`);
    }
    return true;
  }
}