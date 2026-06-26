import {
  ForbiddenException,
  Injectable,
  Logger,
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
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReferencesService {
  private readonly logger = new Logger(ReferencesService.name);

  /** Absolute path to the uploads root (project-root/uploads) */
  private readonly uploadsRoot = path.join(process.cwd(), 'uploads');

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
   * Read an uploaded GraphQL file stream into a Buffer and metadata.
   */
  private async readFileStream(
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

  /**
   * Save a buffer to disk inside uploads/references/ and return the relative
   * path (relative to the uploads root) for storage in the database.
   *
   * File is saved as: uploads/references/<timestamp>-<originalName>
   */
  private async saveFileToDisk(
    buffer: Buffer,
    originalName: string,
  ): Promise<string> {
    const referencesDir = path.join(this.uploadsRoot, 'references');

    // Ensure the directory exists
    await fs.promises.mkdir(referencesDir, { recursive: true });

    // Prefix with timestamp to avoid name collisions
    const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const absolutePath = path.join(referencesDir, safeName);

    await fs.promises.writeFile(absolutePath, buffer);

    // Return the path relative to the uploads root, using forward slashes
    return `references/${safeName}`;
  }

  /**
   * Delete a file from disk given its relative path inside the uploads dir.
   */
  private async deleteFileFromDisk(relativePath: string): Promise<void> {
    if (!relativePath) return;

    const absolutePath = path.join(this.uploadsRoot, relativePath);
    try {
      await fs.promises.unlink(absolutePath);
    } catch (error) {
      // File may have already been deleted — log and move on
      this.logger.warn(
        `Failed to delete file "${absolutePath}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAll(
    type?: string,
    songId?: string,
  ): Promise<ReferenceMaterialDocument[]> {
    const filter: any = {};
    if (type) filter.type = type;
    if (songId) filter.songId = songId;
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

    let fileFields = {};

    if (input.file) {
      const uploaded = await this.readFileStream(input.file);
      const relativePath = await this.saveFileToDisk(
        uploaded.buffer,
        uploaded.fileName,
      );
      fileFields = {
        filePath: relativePath,
        fileName: uploaded.fileName,
        fileSize: uploaded.fileSize,
        mimeType: uploaded.mimeType,
      };
    }

    const material = new this.referenceMaterialModel({
      title: input.title,
      type: input.type,
      description: input.description,
      songId: input.songId,
      topic: input.topic,
      ...fileFields,
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
      // Delete old file from disk if it exists
      if (material.filePath) {
        await this.deleteFileFromDisk(material.filePath);
      }

      const uploaded = await this.readFileStream(input.file);
      const relativePath = await this.saveFileToDisk(
        uploaded.buffer,
        uploaded.fileName,
      );
      material.filePath = relativePath;
      material.fileName = uploaded.fileName;
      material.fileSize = uploaded.fileSize;
      material.mimeType = uploaded.mimeType;
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

    // Delete the file from disk if it exists
    if (material.filePath) {
      await this.deleteFileFromDisk(material.filePath);
    }

    await this.referenceMaterialModel.findByIdAndDelete(id).exec();
    return true;
  }
}
