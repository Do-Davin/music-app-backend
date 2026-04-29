import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
}
bootstrap();
