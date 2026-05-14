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
    const karaokeSong = new this.karaokeSongModel(input);
    return karaokeSong.save();
  }
}
