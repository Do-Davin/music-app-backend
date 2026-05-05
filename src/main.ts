import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CHANGED: Enable file upload middleware
  app.use(graphqlUploadExpress({ maxFileSize: 50000000, maxFiles: 10 })); // 50MB max

  // CHANGED: Serve uploaded files statically
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.enableCors();
  await app.listen(3000);
}
bootstrap();