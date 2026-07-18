import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { join } from 'path';
import * as express from 'express';
import * as dns from 'dns';

async function bootstrap() {
  // Set DNS servers to Google's public DNS to resolve MongoDB Atlas SRV records
  // because the local resolver (127.0.0.1) is failing in some environments.
  dns.setServers(['8.8.8.8', '8.8.4.4']);

  const app = await NestFactory.create(AppModule);

  // ─── CRITICAL: graphqlUploadExpress MUST be registered on the underlying
  // Express instance BEFORE NestJS/Apollo middleware is attached.
  // @nestjs/apollo registers Apollo's expressMiddleware during module init
  // (inside app.init()). If we use app.use() here it runs after Apollo,
  // too late to parse the multipart body. By calling getHttpAdapter().use()
  // we inject into the raw Express app at the earliest possible point.
  const expressApp = app.getHttpAdapter().getInstance() as express.Application;
  expressApp.use(
    '/graphql',
    graphqlUploadExpress({ maxFileSize: 50_000_000, maxFiles: 10 }),
  );

  // Global validation pipe — validates all incoming DTOs using class-validator.
  // whitelist is intentionally OFF: with GraphQL uploads the `file` field is a
  // Promise<FileUpload> which has no class-validator decorator. Setting
  // whitelist:true would strip it before the resolver can access it, silently
  // breaking all file uploads. We rely on @IsIn / @IsNotEmpty decorators for
  // field-level validation instead.
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      transform: true,
      skipMissingProperties: false,
    }),
  );

  // Trust proxy headers for rate limiting to work correctly behind reverse
  // proxies (Nginx, ALB, Cloudflare, etc.)
  expressApp.set('trust proxy', 1);

  // Serve uploaded files (kept for any legacy static assets that may exist)
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Allow the web client (running on a different localhost port) to call the
  // GraphQL API. Required for login/signup because browsers block requests if
  // the preflight OPTIONS doesn't return Access-Control-Allow-Origin.
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });

  await app.listen(3000, '0.0.0.0');
}

bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
});
