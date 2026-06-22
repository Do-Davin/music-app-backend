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

  async findPublic(): Promise<KaraokeSong[]> {
    return this.karaokeSongModel
      .find({ isPublic: true })
      .sort({ createdAt: -1 })
      .exec();
  }

  async searchOwn(userId: string, query: string): Promise<KaraokeSong[]> {
    if (!query) return this.findByUser(userId);
    const searchRegex = new RegExp(query, 'i');
    return this.karaokeSongModel
      .find({
        userId,
        $or: [{ title: searchRegex }, { artist: searchRegex }],
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async searchPublic(query: string): Promise<KaraokeSong[]> {
    const filter: any = { isPublic: true };
    if (query) {
      const searchRegex = new RegExp(query, 'i');
      filter.$or = [{ title: searchRegex }, { artist: searchRegex }];
    }
    return this.karaokeSongModel
      .find(filter)
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

  async updateVisibility(
    userId: string,
    id: string,
    isPublic: boolean,
  ): Promise<KaraokeSong> {
    const updated = await this.karaokeSongModel
      .findOneAndUpdate(
        { _id: id, userId },
        { $set: { isPublic } },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new Error("Karaoke song not found or you don't have permission");
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.karaokeSongModel
      .deleteOne({ _id: id, userId })
      .exec();
    return result.deletedCount > 0;
  }
}
