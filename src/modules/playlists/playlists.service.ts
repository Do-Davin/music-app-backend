import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Playlist, PlaylistDocument } from './schemas/playlist.schema';
import { CreatePlaylistInput } from './dto/create-playlist.input';
import { UpdatePlaylistInput } from './dto/update-playlist.input';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  async create(userId: string, createPlaylistInput: CreatePlaylistInput): Promise<Playlist> {
    const newPlaylist = new this.playlistModel({
      ...createPlaylistInput,
      userId: new Types.ObjectId(userId),
    });
    return newPlaylist.save();
  }

  async findAll(): Promise<Playlist[]> {
    return this.playlistModel.find().exec();
  }

  async findByUser(userId: string): Promise<Playlist[]> {
    return this.playlistModel.find({ userId: new Types.ObjectId(userId) }).exec();
  }

  async findOne(id: string): Promise<PlaylistDocument> {
    const playlist = await this.playlistModel.findById(id).exec();
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID "${id}" not found`);
    }
    return playlist;
  }

  async update(userId: string, updatePlaylistInput: UpdatePlaylistInput): Promise<Playlist> {
    const { id, ...updateData } = updatePlaylistInput;
    const playlist = await this.playlistModel
      .findOneAndUpdate(
        { _id: id, userId: new Types.ObjectId(userId) },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist not found or you don't have permission`);
    }
    return playlist;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.playlistModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();
    
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Playlist not found or you don't have permission`);
    }
    return true;
  }

  async addSong(userId: string, playlistId: string, songId: string): Promise<Playlist> {
    const playlist = await this.playlistModel
      .findOneAndUpdate(
        { _id: playlistId, userId: new Types.ObjectId(userId) },
        { $addToSet: { songIds: new Types.ObjectId(songId) } },
        { new: true },
      )
      .exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist not found or you don't have permission`);
    }
    return playlist;
  }

  async removeSong(userId: string, playlistId: string, songId: string): Promise<Playlist> {
    const playlist = await this.playlistModel
      .findOneAndUpdate(
        { _id: playlistId, userId: new Types.ObjectId(userId) },
        { $pull: { songIds: new Types.ObjectId(songId) } },
        { new: true },
      )
      .exec();

    if (!playlist) {
      throw new NotFoundException(`Playlist not found or you don't have permission`);
    }
    return playlist;
  }
}
