import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePlaylistInput } from './dto/create-playlist.input';
import { UpdatePlaylistInput } from './dto/update-playlist.input';
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

  async create(
    userId: string,
    createPlaylistInput: CreatePlaylistInput,
  ): Promise<Playlist> {
    this.validateObjectId(userId, 'User ID');

    const newPlaylist = new this.playlistModel({
      ...createPlaylistInput,
      ownerId: new Types.ObjectId(userId),
      userId: new Types.ObjectId(userId),
    });
    return newPlaylist.save();
  }

  async findAll(): Promise<Playlist[]> {
    return this.playlistModel.find().exec();
  }

  async findByUser(userId: string): Promise<Playlist[]> {
    this.validateObjectId(userId, 'User ID');
    return this.playlistModel
      .find({
        $or: [
          { userId: new Types.ObjectId(userId) },
          { ownerId: new Types.ObjectId(userId) },
        ],
      })
      .exec();
  }

  async findOne(id: string): Promise<PlaylistDocument> {
    this.validateObjectId(id, 'Playlist ID');

    const playlist = await this.playlistModel.findById(id).exec();
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID "${id}" not found`);
    }
    return playlist;
  }

  async findOrCreateLikedSongsPlaylist(ownerId: string): Promise<Playlist> {
    this.validateObjectId(ownerId, 'User ID');

    const userObjectId = new Types.ObjectId(ownerId);
    const existing = await this.playlistModel
      .findOne({
        name: 'Liked Songs',
        $or: [{ userId: userObjectId }, { ownerId: userObjectId }],
      })
      .exec();

    if (existing) {
      return existing;
    }

    const created = new this.playlistModel({
      ownerId: userObjectId,
      userId: userObjectId,
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

  async update(
    userId: string,
    updatePlaylistInput: UpdatePlaylistInput,
  ): Promise<Playlist> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(updatePlaylistInput.id, 'Playlist ID');

    const { id, ...updateData } = updatePlaylistInput;
    const playlist = await this.playlistModel
      .findOneAndUpdate(
        {
          _id: id,
          $or: [
            { userId: new Types.ObjectId(userId) },
            { ownerId: new Types.ObjectId(userId) },
          ],
        },
        { $set: updateData },
        { new: true },
      )
      .exec();

    if (!playlist) {
      throw new NotFoundException(
        `Playlist not found or you don't have permission`,
      );
    }
    return playlist;
  }

  async remove(userId: string, id: string): Promise<boolean> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(id, 'Playlist ID');

    const result = await this.playlistModel
      .deleteOne({
        _id: id,
        $or: [
          { userId: new Types.ObjectId(userId) },
          { ownerId: new Types.ObjectId(userId) },
        ],
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Playlist not found or you don't have permission`,
      );
    }
    return true;
  }

  async addSong(
    userId: string,
    playlistId: string,
    songId: string,
  ): Promise<Playlist> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(playlistId, 'Playlist ID');
    this.validateObjectId(songId, 'Song ID');

    const playlist = await this.playlistModel
      .findOneAndUpdate(
        {
          _id: playlistId,
          $or: [
            { userId: new Types.ObjectId(userId) },
            { ownerId: new Types.ObjectId(userId) },
          ],
        },
        { $addToSet: { songIds: new Types.ObjectId(songId) } },
        { new: true },
      )
      .exec();

    if (!playlist) {
      throw new NotFoundException(
        `Playlist not found or you don't have permission`,
      );
    }
    return playlist;
  }

  async removeSong(
    userId: string,
    playlistId: string,
    songId: string,
  ): Promise<Playlist> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(playlistId, 'Playlist ID');
    this.validateObjectId(songId, 'Song ID');

    const playlist = await this.playlistModel
      .findOneAndUpdate(
        {
          _id: playlistId,
          $or: [
            { userId: new Types.ObjectId(userId) },
            { ownerId: new Types.ObjectId(userId) },
          ],
        },
        { $pull: { songIds: new Types.ObjectId(songId) } },
        { new: true },
      )
      .exec();

    if (!playlist) {
      throw new NotFoundException(
        `Playlist not found or you don't have permission`,
      );
    }
    return playlist;
  }
}
