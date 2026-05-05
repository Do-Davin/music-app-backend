import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ReferenceMaterial, ReferenceMaterialDocument } from './schemas/reference-material.schema';
import { CreateReferenceMaterialInput } from './dto/create-reference-material.input';
import { UpdateReferenceMaterialInput } from './dto/update-reference-material.input';
import { FileUploadUtil } from '../common/utils/file-upload.util';

@Injectable()
export class ReferencesService {
  constructor(
    @InjectModel(ReferenceMaterial.name)
    private referenceMaterialModel: Model<ReferenceMaterialDocument>,
  ) {}

  async findAll(type?: string): Promise<ReferenceMaterialDocument[]> {
    const filter = type ? { type } : {};
    return this.referenceMaterialModel.find(filter).exec();
  }

  async findOne(id: string): Promise<ReferenceMaterialDocument> {
    const material = await this.referenceMaterialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Reference material with ID ${id} not found`);
    }
    return material;
  }

  async create(input: CreateReferenceMaterialInput): Promise<ReferenceMaterialDocument> {
    let fileData = {};

    // CHANGED: Handle file upload
    if (input.file) {
      const uploadedFile = await FileUploadUtil.saveFile(input.file);
      fileData = {
        filePath: uploadedFile.filePath,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
      };
    }

    const material = new this.referenceMaterialModel({
      title: input.title,
      type: input.type,
      description: input.description,
      songId: input.songId,
      topic: input.topic,
      ...fileData,
    });

    return material.save();
  }

  async update(id: string, input: UpdateReferenceMaterialInput): Promise<ReferenceMaterialDocument> {
    const material = await this.findOne(id);
    let fileData = {};

    // CHANGED: Handle file replacement
    if (input.file) {
      // Delete old file if exists
      if (material.filePath) {
        FileUploadUtil.deleteFile(material.filePath);
      }

      const uploadedFile = await FileUploadUtil.saveFile(input.file);
      fileData = {
        filePath: uploadedFile.filePath,
        fileName: uploadedFile.fileName,
        fileSize: uploadedFile.fileSize,
        mimeType: uploadedFile.mimeType,
      };
    }

    Object.assign(material, {
      ...input,
      ...fileData,
    });

    return material.save();
  }

  async delete(id: string): Promise<boolean> {
    const material = await this.findOne(id);

    // CHANGED: Delete associated file
    if (material.filePath) {
      FileUploadUtil.deleteFile(material.filePath);
    }

    await this.referenceMaterialModel.findByIdAndDelete(id).exec();
    return true;
  }
}