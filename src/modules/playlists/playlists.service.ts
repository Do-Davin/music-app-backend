import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePlaylistInput } from './dto/create-playlist.input';
import { UpdatePlaylistInput } from './dto/update-playlist.input';
import { Playlist, PlaylistDocument } from './schemas/playlist.schema';

@Injectable()
export class PlaylistsService implements OnModuleInit {
  private readonly logger = new Logger(PlaylistsService.name);

  constructor(
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  /**
   * On startup, clean up any duplicate "My Uploading" playlists that were
   * created by the old non-atomic find-then-create logic.
   * For each owner, keeps the oldest playlist (most likely to have real data)
   * and removes the rest.
   */
  async onModuleInit(): Promise<void> {
    type DuplicateGroup = {
      _id: Types.ObjectId;
      count: number;
      ids: Types.ObjectId[];
      oldestId: Types.ObjectId;
    };

    try {
      const duplicates = await this.playlistModel.aggregate<DuplicateGroup>([
        { $match: { name: 'My Uploading' } },
        {
          $group: {
            _id: '$ownerId',
            count: { $sum: 1 },
            ids: { $push: '$_id' },
            // Keep the oldest one (first created)
            oldestId: { $first: '$_id' },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ]);

      for (const dup of duplicates) {
        // Delete all except the oldest
        const idsToDelete = dup.ids.filter(
          (id: Types.ObjectId) => id.toString() !== dup.oldestId.toString(),
        );
        const result = await this.playlistModel
          .deleteMany({ _id: { $in: idsToDelete } })
          .exec();
        this.logger.warn(
          `Cleaned up ${result.deletedCount} duplicate "My Uploading" playlist(s) for owner ${dup._id.toString()}`,
        );
      }

      if (duplicates.length > 0) {
        this.logger.log(
          `Duplicate cleanup complete: fixed ${duplicates.length} user(s)`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to clean up duplicate playlists', error);
    }
  }

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

  /**
   * Returns only PUBLIC playlists.
   * Private playlists are never exposed to the public listing.
   */
  async findAll(): Promise<Playlist[]> {
    return this.playlistModel.find({ isPublic: true }).exec();
  }

  async findByUser(userId: string): Promise<Playlist[]> {
    this.validateObjectId(userId, 'User ID');
    const userObjectId = new Types.ObjectId(userId);

    // Atomically ensure "My Uploading" playlist exists for this user.
    // Using findOneAndUpdate with upsert prevents race conditions where
    // concurrent calls could both create a new playlist (duplicate).
    await this.playlistModel
      .findOneAndUpdate(
        {
          name: 'My Uploading',
          ownerId: userObjectId,
        },
        {
          $setOnInsert: {
            ownerId: userObjectId,
            userId: userObjectId,
            name: 'My Uploading',
            description: 'Your personal music library',
            coverImageUrl: null,
            songIds: [],
            isPublic: false,
          },
        },
        { upsert: true, new: true },
      )
      .exec();

    return this.playlistModel
      .find({
        $or: [
          { userId: userObjectId },
          { ownerId: userObjectId },
          { savedUserIds: userObjectId },
        ],
      })
      .exec();
  }

  /**
   * Fetch a single playlist by ID.
   * - Owners can always view their own playlists.
   * - Other users can only view public playlists.
   * - Returns 403 for private playlists accessed by non-owners.
   */
  async findOne(id: string, currentUserId?: string): Promise<PlaylistDocument> {
    this.validateObjectId(id, 'Playlist ID');

    const playlist = await this.playlistModel.findById(id).exec();
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID "${id}" not found`);
    }

    const isOwner =
      currentUserId &&
      (playlist.ownerId?.toString() === currentUserId ||
        playlist.userId?.toString() === currentUserId);

    if (!playlist.isPublic && !isOwner) {
      throw new ForbiddenException('This playlist is private');
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

  async moveSongBetweenPlaylists(
    userId: string,
    fromPlaylistId: string,
    toPlaylistId: string,
    songId: string,
  ): Promise<Playlist> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(fromPlaylistId, 'From Playlist ID');
    this.validateObjectId(toPlaylistId, 'To Playlist ID');
    this.validateObjectId(songId, 'Song ID');

    const userObjectId = new Types.ObjectId(userId);
    const songObjectId = new Types.ObjectId(songId);

    // 1. Remove from source playlist
    const fromPlaylist = await this.playlistModel
      .findOneAndUpdate(
        {
          _id: fromPlaylistId,
          $or: [{ userId: userObjectId }, { ownerId: userObjectId }],
        },
        { $pull: { songIds: songObjectId } },
        { new: true },
      )
      .exec();

    if (!fromPlaylist) {
      throw new NotFoundException(
        `Source playlist not found or you don't have permission`,
      );
    }

    // 2. Add to destination playlist
    const toPlaylist = await this.playlistModel
      .findOneAndUpdate(
        {
          _id: toPlaylistId,
          $or: [{ userId: userObjectId }, { ownerId: userObjectId }],
        },
        { $addToSet: { songIds: songObjectId } },
        { new: true },
      )
      .exec();

    if (!toPlaylist) {
      // Rollback: put it back in the source playlist
      await this.playlistModel
        .findByIdAndUpdate(fromPlaylistId, {
          $addToSet: { songIds: songObjectId },
        })
        .exec();

      throw new NotFoundException(
        `Destination playlist not found or you don't have permission`,
      );
    }

    return toPlaylist;
  }

  async search(userId: string, query: string): Promise<Playlist[]> {
    if (!query) return [];
    this.validateObjectId(userId, 'User ID');
    const userObjectId = new Types.ObjectId(userId);
    const searchRegex = new RegExp(query, 'i');

    return this.playlistModel
      .find({
        $and: [
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
            ],
          },
          {
            $or: [
              { userId: userObjectId },
              { ownerId: userObjectId },
              { isPublic: true },
            ],
          },
        ],
      })
      .exec();
  }

  async saveToLibrary(userId: string, playlistId: string): Promise<Playlist> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(playlistId, 'Playlist ID');
    const userObjectId = new Types.ObjectId(userId);
    const playlistObjectId = new Types.ObjectId(playlistId);

    const playlist = await this.playlistModel.findById(playlistObjectId).exec();
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID "${playlistId}" not found`);
    }

    if (!playlist.isPublic && playlist.ownerId?.toString() !== userId) {
      throw new BadRequestException('Cannot add private playlist to library');
    }

    const updated = await this.playlistModel
      .findByIdAndUpdate(
        playlistObjectId,
        { $addToSet: { savedUserIds: userObjectId } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Failed to update playlist');
    }
    return updated;
  }

  async removeFromLibrary(userId: string, playlistId: string): Promise<Playlist> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(playlistId, 'Playlist ID');
    const userObjectId = new Types.ObjectId(userId);
    const playlistObjectId = new Types.ObjectId(playlistId);

    const playlist = await this.playlistModel.findById(playlistObjectId).exec();
    if (!playlist) {
      throw new NotFoundException(`Playlist with ID "${playlistId}" not found`);
    }

    const updated = await this.playlistModel
      .findByIdAndUpdate(
        playlistObjectId,
        { $pull: { savedUserIds: userObjectId } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Failed to update playlist');
    }
    return updated;
  }
}
