import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  PracticeSession,
  PracticeSessionSchema,
} from './schemas/practice-session.schema';
import { PracticeSessionsService } from './practice-sessions.service';
import { PracticeSessionsResolver } from './practice-sessions.resolver';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PracticeSession.name, schema: PracticeSessionSchema },
    ]),
  ],
  providers: [PracticeSessionsService, PracticeSessionsResolver],
  exports: [PracticeSessionsService],
})
export class PracticeSessionsModule {}
