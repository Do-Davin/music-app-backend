import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary';

export type UploadBufferParams = {
  buffer: Buffer;
  key: string;
  contentType: string;
  metadata?: Record<string, string>;
  /**
   * Cloudinary resource type.
   * - 'image'  → raster/vector images (default for profile pictures)
   * - 'video'  → audio and video files
   * - 'raw'    → any other file: PDFs, DOCXs, ZIPs, etc.
   * - 'auto'   → let Cloudinary detect (not always reliable for PDFs)
   * Defaults to 'auto' so the service works correctly for all file types.
   */
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
};

export type UploadBufferResult = {
  url: string;
  key: string;
  resourceType: string;
};

@Injectable()
export class CloudinaryStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  async uploadBuffer(params: UploadBufferParams): Promise<UploadBufferResult> {
    this.configureCloudinary();

    const resourceType = params.resourceType ?? 'auto';

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          // Use public_id to set the exact path; using `folder` would let
          // Cloudinary auto-generate the filename portion, making the
          // stored key unpredictable and harder to delete later.
          public_id: params.key,
          resource_type: resourceType,
          context: params.metadata,
          // Overwrite if the same key is re-uploaded (idempotent updates)
          overwrite: true,
          invalidate: true,
        },
        (error, result) => {
          if (error) {
            reject(new Error(error.message || 'Cloudinary upload failed'));
            return;
          }

          if (!result) {
            reject(new Error('Cloudinary upload returned no result'));
            return;
          }

          resolve(result);
        },
      );

      uploadStream.end(params.buffer);
    });

    return {
      url: result.secure_url,
      key: result.public_id,
      resourceType: result.resource_type,
    };
  }

  buildThumbnailUrl(publicId: string, size = 150): string | undefined {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    if (!cloudName || !publicId?.trim()) return undefined;
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_${size},h_${size},c_fill,f_auto,q_auto/${publicId}`;
  }

  /**
   * Delete a Cloudinary asset by its public_id.
   *
   * @param key         The Cloudinary public_id of the asset.
   * @param resourceType The resource type used when the asset was uploaded.
   *                    Must match exactly or Cloudinary will return "not found".
   *                    Defaults to 'image' to preserve existing behaviour for
   *                    profile picture deletion.
   */
  async deleteFile(
    key: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'image',
  ): Promise<void> {
    if (!key?.trim()) {
      return;
    }

    try {
      this.configureCloudinary();
      await cloudinary.uploader.destroy(key, { resource_type: resourceType });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to delete Cloudinary asset "${key}" (${resourceType}): ${message}`,
      );
    }
  }

  private configureCloudinary(): void {
    if (this.configured) {
      return;
    }

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new InternalServerErrorException(
        'CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET are required',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.configured = true;
  }
}
