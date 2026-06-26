import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSongInput } from './dto/create-song.input';
import { UpdateSongInput } from './dto/update-song.input';
import { Song, SongDocument } from './schemas/song.schema';
import {
  RecentlyPlayed,
  RecentlyPlayedDocument,
} from '../users/schemas/recently-played.schema';
import {
  UserLikedSong,
  UserLikedSongDocument,
} from '../users/schemas/user-liked-song.schema';
import {
  Playlist,
  PlaylistDocument,
} from '../playlists/schemas/playlist.schema';

@Injectable()
export class SongsService {
  constructor(
    @InjectModel(Song.name) private songModel: Model<SongDocument>,
    @InjectModel(RecentlyPlayed.name)
    private recentlyPlayedModel: Model<RecentlyPlayedDocument>,
    @InjectModel(UserLikedSong.name)
    private userLikedSongModel: Model<UserLikedSongDocument>,
    @InjectModel(Playlist.name) private playlistModel: Model<PlaylistDocument>,
  ) {}

  async create(
    userId: string,
    createSongInput: CreateSongInput,
  ): Promise<Song> {
    // Check for duplicate YouTube URL for this user
    if (createSongInput.source === 'youtube' && createSongInput.sourcePath) {
      const userExistingYt = await this.songModel
        .findOne({
          userId: new Types.ObjectId(userId),
          source: 'youtube',
          sourcePath: createSongInput.sourcePath,
        })
        .exec();

      if (userExistingYt) {
        throw new BadRequestException(
          'You have already uploaded this YouTube video to your library.',
        );
      }
    }

    // Check for duplicate song title for this user
    const existing = await this.songModel
      .findOne({
        userId: new Types.ObjectId(userId),
        title: { $regex: new RegExp(`^${createSongInput.title}$`, 'i') },
      })
      .exec();

    if (existing) {
      throw new BadRequestException(
        `A song with title "${createSongInput.title}" already exists in your library.`,
      );
    }

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

  /**
   * Fetch a single song by ID.
   *
   * Access rules:
   *  - Public song: accessible to anyone (authenticated or not).
   *  - Private song: accessible only to its owner (viewerUserId must match song.userId).
   *  - Private song accessed by another user or anonymously: 403.
   */
  async findOne(id: string, viewerUserId?: string): Promise<Song> {
    const song = await this.songModel.findById(id).exec();
    if (!song) {
      throw new NotFoundException(`Song with ID "${id}" not found`);
    }

    if (!song.isPublic) {
      const isOwner = viewerUserId && song.userId?.toString() === viewerUserId;
      if (!isOwner) {
        throw new ForbiddenException(
          `This song is currently private. You cannot view it unless the owner makes it public.`,
        );
      }
    }

    return song;
  }

  async update(
    userId: string,
    updateSongInput: UpdateSongInput,
  ): Promise<Song> {
    const { id, ...updateData } = updateSongInput;

    const song = await this.songModel.findById(id).exec();
    if (!song) {
      throw new NotFoundException(`Song with ID "${id}" not found`);
    }

    const isOwner = song.userId?.toString() === userId;

    if (!isOwner) {
      // Non-owners cannot modify private songs at all
      if (!song.isPublic) {
        throw new ForbiddenException(
          `This song is currently private. You cannot modify it unless the owner makes it public.`,
        );
      }

      // Non-owners are only allowed to update lyrics on public songs.
      // We silently discard updates to other fields.
      const lyricsValue = updateData.lyrics;
      Object.keys(updateData).forEach((key) => {
        delete updateData[key];
      });
      if (lyricsValue !== undefined) {
        updateData.lyrics = lyricsValue;
      }
    } else if (!song.isPublic) {
      // Owner can ONLY change isPublic when the song is private.
      // All other field updates are discarded until the song is public again.
      const isPublicValue = updateData.isPublic;
      Object.keys(updateData).forEach((key) => {
        delete updateData[key];
      });
      if (isPublicValue !== undefined) {
        updateData.isPublic = isPublicValue;
      }
    }

    const updated = await this.songModel
      .findByIdAndUpdate(id, { $set: updateData }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException(`Song not found`);
    }

    return updated;
  }

  /**
   * Delete a song owned by userId, then cascade-remove references from:
   *  - recently_played collection
   *  - user_liked_songs collection
   *  - playlists.songIds arrays
   */
  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.songModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Song not found or you don't have permission`,
      );
    }

    const songObjectId = new Types.ObjectId(id);
    await Promise.all([
      this.recentlyPlayedModel.deleteMany({ songId: songObjectId }).exec(),
      this.userLikedSongModel.deleteMany({ songId: songObjectId }).exec(),
      this.playlistModel
        .updateMany(
          { songIds: songObjectId },
          { $pull: { songIds: songObjectId } },
        )
        .exec(),
    ]);

    return true;
  }

  async search(userId: string, query: string): Promise<Song[]> {
    if (!query) return [];

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedQuery, 'i');
    const userObjectId = new Types.ObjectId(userId);
    return this.songModel
      .find({
        $and: [
          {
            $or: [
              { title: searchRegex },
              { artist: searchRegex },
              { albumName: searchRegex },
              { lyrics: searchRegex },
              { tags: searchRegex },
            ],
          },
          {
            $or: [
              { userId: userObjectId },
              { isPublic: true },
            ],
          },
        ],
      })
      .exec();
  }

  /**
   * Fetch many songs by IDs, preserving the given order.
   *
   * If viewerUserId is provided, the viewer's own private songs are included
   * (so recently-played and liked-songs can surface the owner's private tracks).
   * Without viewerUserId only public songs are returned.
   */
  async findManyByIds(
    ids: Array<string | Types.ObjectId>,
    viewerUserId?: string,
    ignorePrivacy = false,
  ): Promise<Song[]> {
    if (!ids.length) {
      return [];
    }

    const songs = ignorePrivacy
      ? await this.songModel
          .find({ _id: { $in: ids } })
          .lean()
          .exec()
      : viewerUserId
      ? await this.songModel
          .find({
            _id: { $in: ids },
            $or: [
              { isPublic: true },
              { userId: new Types.ObjectId(viewerUserId) },
            ],
          })
          .lean()
          .exec()
      : await this.songModel
          .find({ _id: { $in: ids }, isPublic: true })
          .lean()
          .exec();

    // Preserve the original order
    const byId = new Map(songs.map((song) => [String(song._id), song]));
    const orderedSongs: Song[] = [];

    for (const id of ids) {
      const song = byId.get(String(id));
      if (song) {
        orderedSongs.push(song as Song);
      }
    }

    return orderedSongs;
  }
}
