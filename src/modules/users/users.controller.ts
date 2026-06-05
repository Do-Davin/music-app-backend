import {
  BadRequestException,
  Controller,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { RestJwtAuthGuard } from '../auth/guards/rest-jwt-auth.guard';
import { CloudinaryStorageService } from '../storage/cloudinary-storage.service';
import { CurrentUserData } from '../auth/decorators/current-user.decorator';
import { UserWithoutPassword, UsersService } from './users.service';
import { ProfileType } from './schemas/user.schema';

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_PROFILE_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type AuthenticatedRequest = Request & {
  user?: CurrentUserData;
};

type ProfileImageResponse = {
  _id: unknown;
  username?: string;
  email: string;
  profileType: ProfileType;
  profileImageUrl?: string;
  profileImageKey?: string;
  profileImageUpdatedAt?: Date;
  profileImageContentType?: string;
  profileImageSize?: number;
};

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly cloudinaryStorageService: CloudinaryStorageService,
  ) {}

  @Post('me/profile-image')
  @UseGuards(RestJwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('image', {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_PROFILE_IMAGE_SIZE_BYTES,
      },
    }),
  )
  async uploadMyProfileImage(
    @Req() req: AuthenticatedRequest,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<ProfileImageResponse> {
    const userId = req.user?.userId;

    if (!userId) {
      throw new BadRequestException('Authenticated user is required');
    }

    this.validateProfileImage(image);

    const uploadedImage = await this.cloudinaryStorageService.uploadBuffer({
      buffer: image.buffer,
      key: this.buildProfileImageFolder(userId),
      contentType: image.mimetype,
      metadata: {
        originalName: image.originalname,
        uploadedBy: userId,
      },
    });

    try {
      const { user, oldProfileImageKey } =
        await this.usersService.updateProfileImageMetadata(userId, {
          url: uploadedImage.url,
          key: uploadedImage.key,
          contentType: image.mimetype,
          size: image.size,
        });

      if (oldProfileImageKey && oldProfileImageKey !== uploadedImage.key) {
        await this.cloudinaryStorageService.deleteFile(oldProfileImageKey);
      }

      return this.toProfileImageResponse(user);
    } catch (error) {
      await this.cloudinaryStorageService.deleteFile(uploadedImage.key);
      throw error;
    }
  }

  private validateProfileImage(
    image?: Express.Multer.File,
  ): asserts image is Express.Multer.File {
    if (!image) {
      throw new BadRequestException('Profile image is required');
    }

    if (!ALLOWED_PROFILE_IMAGE_MIME_TYPES.has(image.mimetype)) {
      throw new BadRequestException(
        'Profile image must be a JPG, PNG, or WEBP file',
      );
    }

    if (!image.buffer?.length) {
      throw new BadRequestException('Profile image cannot be empty');
    }

    if (image.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
      throw new BadRequestException('Profile image must be 5MB or smaller');
    }
  }

  private buildProfileImageFolder(userId: string): string {
    return `users/${userId}/profile`;
  }

  private toProfileImageResponse(
    user: UserWithoutPassword,
  ): ProfileImageResponse {
    return {
      _id: user._id,
      username: user.username,
      email: user.email,
      profileType: user.profileType,
      profileImageUrl: user.profileImageUrl,
      profileImageKey: user.profileImageKey,
      profileImageUpdatedAt: user.profileImageUpdatedAt,
      profileImageContentType: user.profileImageContentType,
      profileImageSize: user.profileImageSize,
    };
  }
}
