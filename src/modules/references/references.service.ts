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
import { CloudinaryStorageService } from '../storage/cloudinary-storage.service';

@Injectable()
export class ReferencesService {
  private readonly logger = new Logger(ReferencesService.name);

  constructor(
    @InjectModel(ReferenceMaterial.name)
    private referenceMaterialModel: Model<ReferenceMaterialDocument>,
    @InjectModel(Song.name)
    private songModel: Model<SongDocument>,
    private readonly cloudinaryStorage: CloudinaryStorageService,
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
   * Rejects cleanly on stream error without leaking the partial buffer.
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
      let settled = false;

      const settle = (fn: () => void) => {
        if (settled) return;
        settled = true;
        fn();
      };

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      stream.on('end', () => {
        settle(() => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            fileName: filename,
            fileSize: buffer.length,
            mimeType: mimetype,
          });
        });
      });

      stream.on('error', (error) => {
        settle(() => reject(error));
      });
    });
  }

  /**
   * Upload a buffer to Cloudinary under the "music-app/references" folder.
   * Returns the Cloudinary public_id (key), the secure_url, and the resource_type.
   */
  private async uploadToCloudinary(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
  ): Promise<{ publicId: string; url: string; resourceType: string }> {
    // Sanitise the filename — strip non-safe chars and prefix with timestamp
    const safeName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    const result = await this.cloudinaryStorage.uploadBuffer({
      buffer,
      // key is treated as the full public_id path (not just a folder)
      key: `music-app/references/${safeName}`,
      contentType: mimeType,
      // 'auto' lets Cloudinary detect images, video, and raw (PDF/doc) correctly
      resourceType: 'auto',
    });

    return {
      publicId: result.key,
      url: result.url,
      resourceType: result.resourceType,
    };
  }

  /**
   * Delete a Cloudinary asset by its public_id.
   * Uses the stored resourceType so Cloudinary can find the asset correctly.
   */
  private async deleteFromCloudinary(
    publicId: string,
    resourceType?: string,
  ): Promise<void> {
    if (!publicId) return;
    try {
      await this.cloudinaryStorage.deleteFile(
        publicId,
        (resourceType as 'image' | 'video' | 'raw' | 'auto') ?? 'auto',
      );
    } catch (error) {
      this.logger.warn(
        `Failed to delete Cloudinary asset "${publicId}": ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async findAll(
    type?: string,
    songId?: string,
  ): Promise<ReferenceMaterialDocument[]> {
    const filter: Record<string, unknown> = {};
    // Treat empty strings the same as undefined — prevents accidental
    // empty-string matches in MongoDB
    if (type?.trim()) filter.type = type!.trim();
    if (songId?.trim()) filter.songId = songId!.trim();
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

    let fileFields: Partial<ReferenceMaterial> = {};

    if (input.file) {
      const { buffer, fileName, fileSize, mimeType } =
        await this.readFileStream(input.file);

      const { publicId, url, resourceType } = await this.uploadToCloudinary(
        buffer,
        fileName,
        mimeType,
      );

      fileFields = {
        filePath: publicId, // store the Cloudinary public_id for later deletion
        fileUrl: url,       // store the Cloudinary secure_url for direct access
        cloudinaryResourceType: resourceType,
        fileName,
        fileSize,
        mimeType,
      };
    }

    const material = new this.referenceMaterialModel({
      title: input.title.trim(),
      type: input.type.trim(),
      description: input.description?.trim() || undefined,
      songId: input.songId?.trim() || undefined,
      topic: input.topic?.trim() || undefined,
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
      // Delete the old Cloudinary asset before uploading the new one
      if (material.filePath) {
        await this.deleteFromCloudinary(
          material.filePath,
          material.cloudinaryResourceType,
        );
      }

      const { buffer, fileName, fileSize, mimeType } =
        await this.readFileStream(input.file);

      const { publicId, url, resourceType } = await this.uploadToCloudinary(
        buffer,
        fileName,
        mimeType,
      );

      material.filePath = publicId;
      material.fileUrl = url;
      material.cloudinaryResourceType = resourceType;
      material.fileName = fileName;
      material.fileSize = fileSize;
      material.mimeType = mimeType;
    }

    // Surgical field updates — never pass the file promise to the model.
    // Treat empty strings as "clear the field" for optional fields, but
    // reject empty strings for required fields (title, type).
    if (input.title !== undefined) {
      const trimmed = input.title.trim();
      if (trimmed) material.title = trimmed;
      // If title arrives as empty string, ignore — ValidationPipe already
      // rejected it via @IsNotEmpty, so this is a second safety net.
    }
    if (input.type !== undefined && input.type.trim()) {
      material.type = input.type.trim();
    }
    if (input.description !== undefined) {
      material.description = input.description?.trim() || undefined;
    }
    if (input.songId !== undefined) {
      material.songId = input.songId?.trim() || undefined;
    }
    if (input.topic !== undefined) {
      material.topic = input.topic?.trim() || undefined;
    }

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

    // Delete the asset from Cloudinary before removing the DB document
    if (material.filePath) {
      await this.deleteFromCloudinary(
        material.filePath,
        material.cloudinaryResourceType,
      );
    }

    await this.referenceMaterialModel.findByIdAndDelete(id).exec();
    return true;
  }
}
