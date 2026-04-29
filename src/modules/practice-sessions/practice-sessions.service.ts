import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PracticeSession,
  PracticeSessionDocument,
} from './schemas/practice-session.schema';
import { CreatePracticeSessionInput } from './dto/create-practice-session.input';
import { UpdatePracticeSessionInput } from './dto/update-practice-session.input';

@Injectable()
export class PracticeSessionsService {
  constructor(
    @InjectModel(PracticeSession.name)
    private practiceSessionModel: Model<PracticeSessionDocument>,
  ) {}

  async findAll(): Promise<PracticeSession[]> {
    return this.practiceSessionModel.find().exec();
  }

  async findOne(id: string): Promise<PracticeSession> {
    const practiceSession = await this.practiceSessionModel.findById(id).exec();
    if (!practiceSession) {
      throw new NotFoundException(`Practice Session with ID "${id}" not found`);
    }
    return practiceSession;
  }

  async create(
    createPracticeSessionInput: CreatePracticeSessionInput,
  ): Promise<PracticeSession> {
    const newPracticeSession = new this.practiceSessionModel(
      createPracticeSessionInput,
    );
    return newPracticeSession.save();
  }

  async update(
    id: string,
    updatePracticeSessionInput: UpdatePracticeSessionInput,
  ): Promise<PracticeSession> {
    const practiceSession = await this.practiceSessionModel
      .findByIdAndUpdate(id, updatePracticeSessionInput, { new: true })
      .exec();
    if (!practiceSession) {
      throw new NotFoundException(`Practice Session with ID "${id}" not found`);
    }
    return practiceSession;
  }

  async delete(id: string): Promise<boolean> {
    const result = await this.practiceSessionModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`Practice Session with ID "${id}" not found`);
    }
    return true;
  }
}
