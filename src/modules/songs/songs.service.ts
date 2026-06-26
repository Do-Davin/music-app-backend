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
          `This song is private and can only be accessed by its owner.`,
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
          `This song is private and cannot be modified.`,
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
            $or: [{ userId: userObjectId }, { isPublic: true }],
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
  ): Promise<Song[]> {
    if (!ids.length) {
      return [];
    }

    const songs = viewerUserId
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

  /**
   * Return songs to display on a public profile page.
   *
   * Access rules (centralized here):
   *   canView = false → empty array (section is locked for this viewer)
   *   isSelf = true   → all songs owned by the user (public + private)
   *   otherwise       → only isPublic:true songs owned by the user
   *
   * `isPublic` per song is always respected for non-owners: profile-level
   * songVisibility controls section access; song-level isPublic controls
   * individual song visibility. A friend with FRIENDS_ONLY access still
   * cannot see songs the owner marked private (isPublic:false).
   */
  /**
   * Return liked songs to display on a public profile page.
   *
   * Access rules (centralized here):
   *   canView = false → empty array (section is locked for this viewer)
   *   isSelf = true   → all songs the owner liked, including their own private ones
   *                     (reuses findManyByIds with ownerId so owner-private songs surface)
   *   otherwise       → only isPublic:true songs from the liked IDs
   *                     (reuses findManyByIds with no viewerUserId, ensuring no
   *                      viewer-private-song bias leaks from a third party's liked list)
   *
   * UserLikedSong join records are never returned — only resolved Song objects.
   */
  async findVisibleLikedSongsForPublicProfile(
    targetUserId: string,
    canView: boolean,
    isSelf: boolean,
  ): Promise<Song[]> {
    if (!canView) return [];

    const targetObjectId = new Types.ObjectId(targetUserId);

    const likedEntries = await this.userLikedSongModel
      .find({ userId: targetObjectId })
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    if (!likedEntries.length) return [];

    const likedIds = likedEntries.map((e) => e.songId);

    if (isSelf) {
      // Owner sees their own private liked songs in addition to public ones.
      return this.findManyByIds(likedIds, targetUserId);
    }

    // Non-owner: pass no viewerUserId so only isPublic:true songs are returned.
    // This prevents the viewer's own private songs from appearing in a third
    // party's liked list even if the target happened to like them.
    return this.findManyByIds(likedIds, undefined);
  }

  async findVisibleSongsForPublicProfile(
    ownerId: string,
    canView: boolean,
    isSelf: boolean,
  ): Promise<Song[]> {
    if (!canView) return [];

    const ownerObjectId = new Types.ObjectId(ownerId);

    if (isSelf) {
      return this.songModel
        .find({ userId: ownerObjectId })
        .sort({ createdAt: -1 })
        .exec();
    }

    return this.songModel
      .find({ userId: ownerObjectId, isPublic: true })
      .sort({ createdAt: -1 })
      .exec();
  }
}
