import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Song, SongDocument } from './schemas/song.schema';
import { CreateSongInput } from './dto/create-song.input';
import { UpdateSongInput } from './dto/update-song.input';

@Injectable()
export class SongsService {
  constructor(@InjectModel(Song.name) private songModel: Model<SongDocument>) {}

  async create(userId: string, createSongInput: CreateSongInput): Promise<Song> {
    const newSong = new this.songModel({
      ...createSongInput,
      userId: new Types.ObjectId(userId),
    });
    return newSong.save();
  }

  async findAll(): Promise<Song[]> {
    return this.songModel.find({ isPublic: true }).exec();
  }

  async findByUser(userId: string): Promise<Song[]> {
    return this.songModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(id: string): Promise<Song> {
    const song = await this.songModel.findById(id).exec();
    if (!song) {
      throw new NotFoundException(`Song with ID "${id}" not found`);
    }
    return song;
  }

  async update(userId: string, updateSongInput: UpdateSongInput): Promise<Song> {
    const { id, ...updateData } = updateSongInput;
    const updated = await this.songModel
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        { $set: updateData },
        { new: true },
      )
      .exec();
    if (!updated) {
      throw new NotFoundException(`Song not found or you don't have permission`);
    }
    return updated;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.songModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Song not found or you don't have permission`);
    }
    return true;
  }

  async findManyByIds(ids: string[]): Promise<Song[]> {
    return this.songModel.find({ _id: { $in: ids } }).exec();
  }
}
