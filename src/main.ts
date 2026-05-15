import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { join } from 'path';
import * as express from 'express';
import * as dns from 'dns';

async function bootstrap() {
  // Set DNS servers to Google's public DNS to resolve MongoDB Atlas SRV records
  // because the local resolver (127.0.0.1) is failing in some environments.
  dns.setServers(['8.8.8.8', '8.8.4.4']);

  const app = await NestFactory.create(AppModule);
<<<<<<< HEAD
  // Allow the web client (running on a different localhost port) to call the GraphQL API.
  // This is required for login/signup because browsers block the request if preflight OPTIONS
  // does not get `Access-Control-Allow-Origin`.
  app.enableCors({
    origin: true,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
  });
  await app.listen(3000);
=======

  app.use(graphqlUploadExpress({ maxFileSize: 50000000, maxFiles: 10 })); // 50MB max
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  app.enableCors();
  await app.listen(3000, '0.0.0.0');
>>>>>>> 047c594fedd01f975aa8e04442359535d83cd7f3
}
bootstrap();
