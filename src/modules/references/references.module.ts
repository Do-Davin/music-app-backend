import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReferenceMaterial,
  ReferenceMaterialSchema,
} from './schemas/reference-material.schema';
import { ReferencesService } from './references.service';
import { ReferencesResolver } from './references.resolver';
import { ReferencesController } from './references.controller';
import { SongsModule } from '../songs/songs.module';
import { CloudinaryStorageModule } from '../storage/cloudinary-storage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReferenceMaterial.name, schema: ReferenceMaterialSchema },
    ]),
    SongsModule,
    CloudinaryStorageModule,
  ],
  controllers: [ReferencesController],
  providers: [ReferencesService, ReferencesResolver],
})
export class ReferencesModule {}
