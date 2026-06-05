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

  async findAll(): Promise<KaraokeSong[]> {
    return this.karaokeSongModel.find().sort({ createdAt: -1 }).exec();
  }

  async create(input: CreateKaraokeSongInput): Promise<KaraokeSong> {
    const existing = await this.karaokeSongModel.findOne({
      userId: input.userId,
      sourcePath: input.sourcePath,
    }).exec();

    if (existing) {
      existing.lyrics = input.lyrics;
      existing.title = input.title;
      existing.artist = input.artist;
      if (input.duration) {
        existing.duration = input.duration;
      }
      return existing.save();
    }

    const karaokeSong = new this.karaokeSongModel(input);
    return karaokeSong.save();
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.karaokeSongModel.findByIdAndDelete(id).exec();
    return result != null;
  }
}
