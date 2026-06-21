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

  /**
   * Read an uploaded file stream into a Buffer.
   */
  private async readFileToBuffer(
    file: Promise<import('graphql-upload/processRequest.mjs').FileUpload>,
  ): Promise<{
    buffer: Buffer;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }> {
    const { createReadStream, filename, mimetype } = await file;

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const stream = createReadStream();

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          fileName: filename,
          fileSize: buffer.length,
          mimeType: mimetype,
        });
      });

      stream.on('error', (error) => {
        reject(error);
      });
    });
  }

  async findAll(
    type?: string,
    songId?: string,
  ): Promise<ReferenceMaterialDocument[]> {
    const filter: any = {};
    if (type) filter.type = type;
    if (songId) filter.songId = songId;
    // Exclude fileData from list queries to avoid sending large binary blobs
    return this.referenceMaterialModel
      .find(filter)
      .select('-fileData')
      .exec();
  }

  async findOne(id: string): Promise<ReferenceMaterialDocument> {
    // Exclude fileData from normal findOne to keep responses lightweight
    const material = await this.referenceMaterialModel
      .findById(id)
      .select('-fileData')
      .exec();
    if (!material) {
      throw new NotFoundException(`Reference material with ID ${id} not found`);
    }
    return material;
  }

  /**
   * Fetch a reference material WITH its file binary data for downloading.
   */
  async findOneWithFileData(id: string): Promise<ReferenceMaterialDocument> {
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
      const uploadedFile = await this.readFileToBuffer(input.file);
      fileData = {
        fileData: uploadedFile.buffer,
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
    const material = await this.referenceMaterialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Reference material with ID ${id} not found`);
    }

    // Check ownership of the current song associated with this material
    if (material.songId) {
      await this.validateSongOwnership(userId, material.songId);
    }

    // If changing to a new song, check ownership of that song too
    if (input.songId && input.songId !== material.songId) {
      await this.validateSongOwnership(userId, input.songId);
    }

    if (input.file) {
      const uploadedFile = await this.readFileToBuffer(input.file);
      material.fileData = uploadedFile.buffer;
      material.fileName = uploadedFile.fileName;
      material.fileSize = uploadedFile.fileSize;
      material.mimeType = uploadedFile.mimeType;
      // Clear the old local filePath since data is now in the database
      material.filePath = undefined;
    }

    // Surgical update to avoid passing the file promise to the model
    if (input.title !== undefined) material.title = input.title;
    if (input.type !== undefined) material.type = input.type;
    if (input.description !== undefined)
      material.description = input.description;
    if (input.songId !== undefined) material.songId = input.songId;
    if (input.topic !== undefined) material.topic = input.topic;

    return material.save();
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const material = await this.referenceMaterialModel.findById(id).exec();
    if (!material) {
      throw new NotFoundException(`Reference material with ID ${id} not found`);
    }

    if (material.songId) {
      await this.validateSongOwnership(userId, material.songId);
    }

    // No local file to delete — data lives in MongoDB and will be removed
    // with the document.
    await this.referenceMaterialModel.findByIdAndDelete(id).exec();
    return true;
  }
}
