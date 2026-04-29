import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ReferenceMaterial,
  ReferenceMaterialSchema,
} from './schemas/reference-material.schema';
import { ReferencesService } from './references.service';
import { ReferencesResolver } from './references.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ReferenceMaterial.name, schema: ReferenceMaterialSchema },
    ]),
  ],
  providers: [ReferencesService, ReferencesResolver],
})
export class ReferencesModule {}