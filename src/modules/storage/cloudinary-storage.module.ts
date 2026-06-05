import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryStorageService } from './cloudinary-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [CloudinaryStorageService],
  exports: [CloudinaryStorageService],
})
export class CloudinaryStorageModule {}
