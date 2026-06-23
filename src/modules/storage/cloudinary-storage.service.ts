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
};

export type UploadBufferResult = {
  url: string; 
  key: string;
};

@Injectable()
export class CloudinaryStorageService {
  private readonly logger = new Logger(CloudinaryStorageService.name);
  private configured = false;

  constructor(private readonly configService: ConfigService) {}

  async uploadBuffer(params: UploadBufferParams): Promise<UploadBufferResult> {
    this.configureCloudinary();

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: params.key,
          resource_type: 'image',
          context: params.metadata,
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
    };
  }

  buildThumbnailUrl(publicId: string, size = 150): string | undefined {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    if (!cloudName || !publicId?.trim()) return undefined;
    return `https://res.cloudinary.com/${cloudName}/image/upload/w_${size},h_${size},c_fill,f_auto,q_auto/${publicId}`;
  }

  async deleteFile(key: string): Promise<void> {
    if (!key?.trim()) {
      return;
    }

    try {
      this.configureCloudinary();
      await cloudinary.uploader.destroy(key, { resource_type: 'image' });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Failed to delete Cloudinary image "${key}": ${message}`,
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
