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

@Injectable()
export class SongsService {
  constructor(@InjectModel(Song.name) private songModel: Model<SongDocument>) {}

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
   * Private songs are completely inaccessible — even for the owner.
   * The owner must set isPublic back to true (via updateSong) before the
   * song can be listened to or viewed again.
   */
  async findOne(id: string): Promise<Song> {
    const song = await this.songModel.findById(id).exec();
    if (!song) {
      throw new NotFoundException(`Song with ID "${id}" not found`);
    }

    if (!song.isPublic) {
      throw new ForbiddenException(
        `This song is private. Set it to public to access it again.`,
      );
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

  async remove(userId: string, id: string): Promise<boolean> {
    const result = await this.songModel
      .deleteOne({ _id: id, userId: new Types.ObjectId(userId) })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Song not found or you don't have permission`,
      );
    }

    return true;
  }

  async search(query: string): Promise<Song[]> {
    if (!query) return [];

    const searchRegex = new RegExp(query, 'i');
    return this.songModel
      .find({
        $or: [
          { title: searchRegex },
          { artist: searchRegex },
          { albumName: searchRegex },
          { lyrics: searchRegex },
          { tags: searchRegex },
        ],
        isPublic: true,
      })
      .exec();
  }

  /**
   * Fetch many songs by IDs, preserving the given order.
   * Private songs are always excluded — they are inaccessible until
   * the owner sets them back to public.
   */
  async findManyByIds(
    ids: Array<string | Types.ObjectId>,
  ): Promise<Song[]> {
    if (!ids.length) {
      return [];
    }

    // Only fetch public songs — private songs are completely hidden
    const songs = await this.songModel
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
