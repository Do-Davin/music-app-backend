import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReferenceMaterial,
  ReferenceMaterialDocument,
} from './schemas/reference-material.schema';
import { CreateReferenceMaterialInput } from './dto/create-reference-material.input';
import { UpdateReferenceMaterialInput } from './dto/update-reference-material.input';
import { FileUploadUtil } from '../common/utils/file-upload.util';
import { Song, SongDocument } from '../songs/schemas/song.schema';

@Injectable()
export class ReferencesService {
  constructor(
    @InjectModel(ReferenceMaterial.name)
    private referenceMaterialModel: Model<ReferenceMaterialDocument>,
    @InjectModel(Song.name)
    private songModel: Model<SongDocument>,
  ) {}

  private async validateSongOwnership(
    userId: string,
    songId: string,
  ): Promise<void> {
    const song = await this.songModel.findById(songId).exec();
    if (!song) {
      throw new NotFoundException(`Song with ID ${songId} not found`);
    }
    if (song.userId.toString() !== userId) {
      throw new ForbiddenException(
        'Only the owner of the song can manage its reference materials',
      );
    }
  }

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

  async create(
    userId: string,
    input: CreateReferenceMaterialInput,
  ): Promise<ReferenceMaterialDocument> {
    if (input.songId) {
      await this.validateSongOwnership(userId, input.songId);
    }

    let fileData = {};

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

  async update(
    userId: string,
    id: string,
    input: UpdateReferenceMaterialInput,
  ): Promise<ReferenceMaterialDocument> {
    const material = await this.findOne(id);

    // Check ownership of the current song associated with this material
    if (material.songId) {
      await this.validateSongOwnership(userId, material.songId);
    }

    // If changing to a new song, check ownership of that song too
    if (input.songId && input.songId !== material.songId) {
      await this.validateSongOwnership(userId, input.songId);
    }

    let fileData = {};

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

    // Surgical update to avoid passing the file promise to the model
    if (input.title !== undefined) material.title = input.title;
    if (input.type !== undefined) material.type = input.type;
    if (input.description !== undefined)
      material.description = input.description;
    if (input.songId !== undefined) material.songId = input.songId;
    if (input.topic !== undefined) material.topic = input.topic;

    if (Object.keys(fileData).length > 0) {
      Object.assign(material, fileData);
    }

    return material.save();
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const material = await this.findOne(id);

    if (material.songId) {
      await this.validateSongOwnership(userId, material.songId);
    }

    // CHANGED: Delete associated file
    if (material.filePath) {
      FileUploadUtil.deleteFile(material.filePath);
    }

    await this.referenceMaterialModel.findByIdAndDelete(id).exec();
    return true;
  }
}
