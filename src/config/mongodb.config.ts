import { Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModuleAsyncOptions } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

const logger = new Logger('MongoDB');

export const mongoModuleAsyncOptions: MongooseModuleAsyncOptions = {
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const mongoUri = configService.get<string>('MONGO_URI');

    if (!mongoUri) {
      logger.error(
        'MONGO_URI is missing. MongoDB connection cannot be established.',
      );
      throw new Error('MONGO_URI is required');
    }

    logger.log(`Attempting MongoDB connection: ${mongoUri}`);

    return {
      uri: mongoUri,
      connectionFactory: (connection: Connection): Connection => {
        connection.on('connected', () => {
          logger.log('MongoDB connected successfully.');
        });

        connection.on('error', (error: unknown) => {
          const message =
            error instanceof Error ? error.message : 'Unknown error';
          logger.error(`MongoDB connection error: ${message}`);
        });

        connection.on('disconnected', () => {
          logger.warn('MongoDB disconnected.');
        });

        return connection;
      },
    };
  },
};
