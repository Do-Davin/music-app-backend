import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Playlist, PlaylistDocument } from './schemas/playlist.schema';

@Injectable()
export class PlaylistsService {
  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  private validateObjectId(id: string, fieldName = 'ID'): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
  }

  async findAll(): Promise<Playlist[]> {
    return this.playlistModel.find().exec();
  }

  async findOne(id: string): Promise<Playlist> {
    const playlist = await this.playlistModel.findById(id).exec();
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID "${id}" not found`);
    }
    return playlist;
  }

  async findOrCreateLikedSongsPlaylist(ownerId: string): Promise<Playlist> {
    this.validateObjectId(ownerId, 'User ID');

    const existing = await this.playlistModel
      .findOne({ ownerId: new Types.ObjectId(ownerId), name: 'Liked Songs' })
      .exec();

    if (existing) return existing;

    const created = new this.playlistModel({
      ownerId: new Types.ObjectId(ownerId),
      name: 'Liked Songs',
      description: 'Your liked songs',
      coverImageUrl: null,
      songIds: [],
      isPublic: false,
    });

    return created.save();
  }

  async addSongToLikedSongsPlaylist(
    ownerId: string,
    songId: string,
  ): Promise<void> {
    this.validateObjectId(ownerId, 'User ID');
    this.validateObjectId(songId, 'Song ID');

    const playlist = await this.findOrCreateLikedSongsPlaylist(ownerId);
    await this.playlistModel
      .findByIdAndUpdate(playlist._id, {
        $addToSet: { songIds: new Types.ObjectId(songId) },
      })
      .exec();
  }

  async removeSongFromLikedSongsPlaylist(
    ownerId: string,
    songId: string,
  ): Promise<void> {
    this.validateObjectId(ownerId, 'User ID');
    this.validateObjectId(songId, 'Song ID');

    const playlist = await this.findOrCreateLikedSongsPlaylist(ownerId);
    await this.playlistModel
      .findByIdAndUpdate(playlist._id, {
        $pull: { songIds: new Types.ObjectId(songId) },
      })
      .exec();
  }
}
