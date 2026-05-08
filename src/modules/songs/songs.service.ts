import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Song, SongDocument } from './schemas/song.schema';

@Injectable()
export class SongsService {
  constructor(@InjectModel(Song.name) private songModel: Model<SongDocument>) {}

  async findAll(): Promise<Song[]> {
    return this.songModel.find().exec();
  }

  async findOne(id: string): Promise<Song> {
    const song = await this.songModel.findById(id).exec();
    if (!song) {
      throw new NotFoundException(`Song with ID "${id}" not found`);
    }
    return song;
  }

  async findManyByIds(ids: Types.ObjectId[]): Promise<Song[]> {
    if (!ids.length) return [];

    const songs = await this.songModel
      .find({ _id: { $in: ids } })
      .lean()
      .exec();

    const byId = new Map(songs.map((s) => [String(s._id), s]));
    return ids.map((id) => byId.get(String(id))).filter(Boolean) as Song[];
  }
}
