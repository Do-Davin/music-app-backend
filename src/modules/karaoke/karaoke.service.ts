import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  KaraokeSong,
  KaraokeSongDocument,
} from './schemas/karaoke-song.schema';
import { CreateKaraokeSongInput } from './dto/create-karaoke-song.input';

@Injectable()
export class KaraokeService {
  constructor(
    @InjectModel(KaraokeSong.name)
    private karaokeSongModel: Model<KaraokeSongDocument>,
  ) {}

  getHealth(): string {
    return 'Karaoke backend module is running';
  }

  async findByUser(userId: string): Promise<KaraokeSong[]> {
    return this.karaokeSongModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async create(
    userId: string,
    input: CreateKaraokeSongInput,
  ): Promise<KaraokeSong> {
    return this.karaokeSongModel
      .findOneAndUpdate(
        { userId, source: input.source, sourcePath: input.sourcePath },
        { $set: { ...input, userId } },
        { new: true, upsert: true, setDefaultsOnInsert: true },
      )
      .exec();
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.karaokeSongModel
      .deleteOne({ _id: id, userId })
      .exec();
    return result.deletedCount > 0;
  }
}
