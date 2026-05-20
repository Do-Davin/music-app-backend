import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Friendship,
  FriendshipDocument,
  FriendshipStatus,
} from './schemas/friendship.schema';
import {
  RecentlyPlayed,
  RecentlyPlayedDocument,
} from './schemas/recently-played.schema';
import {
  UserLikedSong,
  UserLikedSongDocument,
} from './schemas/user-liked-song.schema';
import { User, UserDocument } from './schemas/user.schema';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as typeof import('bcryptjs');

export type UserWithoutPassword = Omit<User, 'password'>;
export type RecentlyPlayedEntry = {
  songId: Types.ObjectId;
  playedAt: Date;
};

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Friendship.name)
    private friendshipModel: Model<FriendshipDocument>,
    @InjectModel(UserLikedSong.name)
    private userLikedSongModel: Model<UserLikedSongDocument>,
    @InjectModel(RecentlyPlayed.name)
    private recentlyPlayedModel: Model<RecentlyPlayedDocument>,
  ) {}

  private stripPassword(user: UserDocument): UserWithoutPassword {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _pwd, ...userWithoutPassword } = userObj;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return userWithoutPassword;
  }

  private validateObjectId(id: string, fieldName = 'ID'): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
  }

  private toObjectId(id: string, fieldName = 'ID'): Types.ObjectId {
    this.validateObjectId(id, fieldName);
    return new Types.ObjectId(id);
  }

  private pairKey(firstUserId: string, secondUserId: string): string {
    return [firstUserId, secondUserId].sort().join(':');
  }

  private clampLimit(limit = 20, max = 50): number {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new BadRequestException('Limit must be a positive integer');
    }

    return Math.min(limit, max);
  }

  private normalizeOffset(offset = 0): number {
    if (!Number.isInteger(offset) || offset < 0) {
      throw new BadRequestException('Offset must be a non-negative integer');
    }

    return offset;
  }

  private escapeRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }
  }

  private async ensureUserExists(
    userId: string,
    label = 'User',
  ): Promise<void> {
    this.validateObjectId(userId, `${label} ID`);
    const exists = await this.userModel.exists({ _id: userId }).exec();
    if (!exists) {
      throw new NotFoundException(`${label} with ID "${userId}" not found`);
    }
  }

  async create(
    username: string | undefined,
    email: string,
    password: string,
  ): Promise<UserWithoutPassword> {
    const trimmedUsername = username?.trim();

    if (trimmedUsername !== undefined && trimmedUsername.length < 3) {
      throw new BadRequestException(
        'Username must be at least 3 characters long',
      );
    }
    this.validateEmail(email);
    this.validatePassword(password);

    const existingUser = await this.userModel
      .findOne({
        $or: [
          { email: email.toLowerCase() },
          ...(trimmedUsername ? [{ username: trimmedUsername }] : []),
        ],
      })
      .exec();

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictException('Email already registered');
      }
      if (trimmedUsername && existingUser.username === trimmedUsername) {
        throw new ConflictException('Username already taken');
      }
    }

    try {
      const hashedPassword: string = await bcrypt.hash(password, 10);

      const newUser = new this.userModel({
        ...(trimmedUsername ? { username: trimmedUsername } : {}),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });

      const savedUser = await newUser.save();
      return this.stripPassword(savedUser);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Email or username already exists');
      }
      throw error;
    }
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    this.validateEmail(email);
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    this.validateObjectId(id, 'User ID');
    return this.userModel.findById(id).exec();
  }

  async updateUsername(
    userId: string,
    newUsername: string,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');

    const trimmedUsername = newUsername.trim();
    if (trimmedUsername.length < 3) {
      throw new BadRequestException(
        'Username must be at least 3 characters long',
      );
    }

    const existingUser = await this.userModel
      .findOne({ username: trimmedUsername, _id: { $ne: userId } })
      .exec();

    if (existingUser) {
      throw new ConflictException('Username already taken');
    }

    try {
      const updatedUser = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $set: { username: trimmedUsername } },
          { new: true },
        )
        .exec();

      if (!updatedUser) {
        throw new NotFoundException(`User with ID "${userId}" not found`);
      }

      return this.stripPassword(updatedUser);
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Username already taken');
      }
      throw error;
    }
  }

  async findUsersByUsernameOrEmail(
    search: string,
  ): Promise<UserWithoutPassword[]> {
    const trimmedSearch = search.trim();

    if (!trimmedSearch) {
      throw new BadRequestException('Search cannot be empty');
    }

    const searchRegex = new RegExp(this.escapeRegex(trimmedSearch), 'i');
    const users = await this.userModel
      .find({
        $or: [{ username: searchRegex }, { email: searchRegex }],
      })
      .limit(20)
      .exec();

    return users.map((user) => this.stripPassword(user));
  }

  async sendFriendRequest(
    currentUserId: string,
    targetUserId: string,
  ): Promise<boolean> {
    this.validateObjectId(currentUserId, 'Current user ID');
    this.validateObjectId(targetUserId, 'Target user ID');

    if (currentUserId === targetUserId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    await Promise.all([
      this.ensureUserExists(currentUserId, 'Current user'),
      this.ensureUserExists(targetUserId, 'Target user'),
    ]);

    const pairKey = this.pairKey(currentUserId, targetUserId);
    const existing = await this.friendshipModel.findOne({ pairKey }).exec();

    if (existing?.status === FriendshipStatus.ACCEPTED) {
      throw new ConflictException('Users are already friends');
    }

    if (existing?.status === FriendshipStatus.PENDING) {
      throw new ConflictException('Friend request already exists');
    }

    if (existing?.status === FriendshipStatus.REJECTED) {
      await this.friendshipModel
        .updateOne(
          { _id: existing._id },
          {
            $set: {
              requesterId: this.toObjectId(currentUserId, 'Current user ID'),
              receiverId: this.toObjectId(targetUserId, 'Target user ID'),
              status: FriendshipStatus.PENDING,
            },
          },
        )
        .exec();
      return true;
    }

    try {
      await this.friendshipModel.create({
        requesterId: this.toObjectId(currentUserId, 'Current user ID'),
        receiverId: this.toObjectId(targetUserId, 'Target user ID'),
        status: FriendshipStatus.PENDING,
        pairKey,
      });
      return true;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new ConflictException('Friend request already exists');
      }
      throw error;
    }
  }

  async acceptFriendRequest(
    currentUserId: string,
    requesterUserId: string,
  ): Promise<boolean> {
    this.validateObjectId(currentUserId, 'Current user ID');
    this.validateObjectId(requesterUserId, 'Requester user ID');

    const updated = await this.friendshipModel
      .findOneAndUpdate(
        {
          requesterId: this.toObjectId(requesterUserId, 'Requester user ID'),
          receiverId: this.toObjectId(currentUserId, 'Current user ID'),
          status: FriendshipStatus.PENDING,
        },
        { $set: { status: FriendshipStatus.ACCEPTED } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new BadRequestException('No incoming friend request found');
    }

    return true;
  }

  async rejectFriendRequest(
    currentUserId: string,
    requesterUserId: string,
  ): Promise<boolean> {
    this.validateObjectId(currentUserId, 'Current user ID');
    this.validateObjectId(requesterUserId, 'Requester user ID');

    const updated = await this.friendshipModel
      .findOneAndUpdate(
        {
          requesterId: this.toObjectId(requesterUserId, 'Requester user ID'),
          receiverId: this.toObjectId(currentUserId, 'Current user ID'),
          status: FriendshipStatus.PENDING,
        },
        { $set: { status: FriendshipStatus.REJECTED } },
      )
      .exec();

    if (!updated) {
      throw new BadRequestException('No incoming friend request found');
    }

    return true;
  }

  async cancelFriendRequest(
    currentUserId: string,
    targetUserId: string,
  ): Promise<boolean> {
    this.validateObjectId(currentUserId, 'Current user ID');
    this.validateObjectId(targetUserId, 'Target user ID');

    const deleted = await this.friendshipModel
      .deleteOne({
        requesterId: this.toObjectId(currentUserId, 'Current user ID'),
        receiverId: this.toObjectId(targetUserId, 'Target user ID'),
        status: FriendshipStatus.PENDING,
      })
      .exec();

    if (deleted.deletedCount === 0) {
      throw new BadRequestException('No outgoing friend request found');
    }

    return true;
  }

  async getFriends(
    currentUserId: string,
    limit?: number,
    offset?: number,
  ): Promise<UserWithoutPassword[]> {
    this.validateObjectId(currentUserId, 'Current user ID');
    await this.ensureUserExists(currentUserId, 'Current user');

    const userObjectId = this.toObjectId(currentUserId, 'Current user ID');
    const friendships = await this.friendshipModel
      .find({
        status: FriendshipStatus.ACCEPTED,
        $or: [{ requesterId: userObjectId }, { receiverId: userObjectId }],
      })
      .sort({ updatedAt: -1 })
      .skip(this.normalizeOffset(offset))
      .limit(this.clampLimit(limit))
      .lean()
      .exec();

    const friendIds = friendships.map((friendship) =>
      String(friendship.requesterId) === currentUserId
        ? friendship.receiverId
        : friendship.requesterId,
    );

    return this.findUsersByIds(friendIds);
  }

  async getIncomingFriendRequests(
    currentUserId: string,
    limit?: number,
    offset?: number,
  ): Promise<UserWithoutPassword[]> {
    this.validateObjectId(currentUserId, 'Current user ID');
    await this.ensureUserExists(currentUserId, 'Current user');

    const requests = await this.friendshipModel
      .find({
        receiverId: this.toObjectId(currentUserId, 'Current user ID'),
        status: FriendshipStatus.PENDING,
      })
      .sort({ createdAt: -1 })
      .skip(this.normalizeOffset(offset))
      .limit(this.clampLimit(limit))
      .lean()
      .exec();

    return this.findUsersByIds(requests.map((request) => request.requesterId));
  }

  async getOutgoingFriendRequests(
    currentUserId: string,
    limit?: number,
    offset?: number,
  ): Promise<UserWithoutPassword[]> {
    this.validateObjectId(currentUserId, 'Current user ID');
    await this.ensureUserExists(currentUserId, 'Current user');

    const requests = await this.friendshipModel
      .find({
        requesterId: this.toObjectId(currentUserId, 'Current user ID'),
        status: FriendshipStatus.PENDING,
      })
      .sort({ createdAt: -1 })
      .skip(this.normalizeOffset(offset))
      .limit(this.clampLimit(limit))
      .lean()
      .exec();

    return this.findUsersByIds(requests.map((request) => request.receiverId));
  }

  private async findUsersByIds(
    ids: Types.ObjectId[],
  ): Promise<UserWithoutPassword[]> {
    if (!ids.length) {
      return [];
    }

    const users = await this.userModel.find({ _id: { $in: ids } }).exec();
    const byId = new Map(users.map((user) => [String(user._id), user]));

    const orderedUsers: UserWithoutPassword[] = [];

    for (const id of ids) {
      const user = byId.get(String(id));
      if (user) {
        orderedUsers.push(this.stripPassword(user));
      }
    }

    return orderedUsers;
  }

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
    this.validateEmail(email);

    const user = await this.findByEmail(email);
    if (user && (await bcrypt.compare(password, user.password))) {
      return this.stripPassword(user);
    }
    return null;
  }

  async updateProfileImage(
    userId: string,
    imageUrl: string,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');

    if (!imageUrl || !imageUrl.trim()) {
      throw new BadRequestException('Image URL cannot be empty');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { profileImageUrl: imageUrl.trim() },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.stripPassword(updatedUser);
  }

  async addLikedSong(userId: string, songId: string): Promise<boolean> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(songId, 'Song ID');
    await this.ensureUserExists(userId);

    try {
      await this.userLikedSongModel.create({
        userId: this.toObjectId(userId, 'User ID'),
        songId: this.toObjectId(songId, 'Song ID'),
      });
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) {
        throw error;
      }
    }

    return true;
  }

  async removeLikedSong(userId: string, songId: string): Promise<boolean> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(songId, 'Song ID');
    await this.ensureUserExists(userId);

    await this.userLikedSongModel
      .deleteOne({
        userId: this.toObjectId(userId, 'User ID'),
        songId: this.toObjectId(songId, 'Song ID'),
      })
      .exec();

    return true;
  }

  async getLikedSongs(
    userId: string,
    limit?: number,
    offset?: number,
  ): Promise<Types.ObjectId[]> {
    this.validateObjectId(userId, 'User ID');
    await this.ensureUserExists(userId);

    const likedSongs = await this.userLikedSongModel
      .find({ userId: this.toObjectId(userId, 'User ID') })
      .sort({ createdAt: -1 })
      .skip(this.normalizeOffset(offset))
      .limit(this.clampLimit(limit))
      .lean()
      .exec();

    return likedSongs.map((likedSong) => likedSong.songId);
  }

  async isSongLiked(userId: string, songId: string): Promise<boolean> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(songId, 'Song ID');
    await this.ensureUserExists(userId);

    const likedSong = await this.userLikedSongModel
      .exists({
        userId: this.toObjectId(userId, 'User ID'),
        songId: this.toObjectId(songId, 'Song ID'),
      })
      .exec();

    return Boolean(likedSong);
  }

  async addRecentlyPlayed(userId: string, songId: string): Promise<boolean> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(songId, 'Song ID');
    await this.ensureUserExists(userId);

    await this.recentlyPlayedModel.create({
      userId: this.toObjectId(userId, 'User ID'),
      songId: this.toObjectId(songId, 'Song ID'),
      playedAt: new Date(),
    });

    return true;
  }

  async getRecentlyPlayed(
    userId: string,
    limit = 20,
  ): Promise<RecentlyPlayedEntry[]> {
    this.validateObjectId(userId, 'User ID');
    await this.ensureUserExists(userId);

    const entries = await this.recentlyPlayedModel
      .find({ userId: this.toObjectId(userId, 'User ID') })
      .sort({ playedAt: -1 })
      .limit(this.clampLimit(limit, 20))
      .lean()
      .exec();

    return entries.map((entry) => ({
      songId: entry.songId,
      playedAt: entry.playedAt,
    }));
  }

  async updatePracticeGoals(
    userId: string,
    dailyMinutes: number,
    weeklyDays: number,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');

    if (dailyMinutes < 1 || dailyMinutes > 1440) {
      throw new BadRequestException(
        'Daily minutes must be between 1 and 1440 (24 hours)',
      );
    }
    if (weeklyDays < 1 || weeklyDays > 7) {
      throw new BadRequestException('Weekly days must be between 1 and 7');
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          'practiceGoals.dailyMinutes': dailyMinutes,
          'practiceGoals.weeklyDays': weeklyDays,
        },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.stripPassword(updatedUser);
  }

  async updatePreferences(
    userId: string,
    defaultBpm?: number,
    tuningHz?: number,
    instrument?: string,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');

    if (defaultBpm !== undefined && (defaultBpm < 20 || defaultBpm > 300)) {
      throw new BadRequestException('BPM must be between 20 and 300');
    }
    if (tuningHz !== undefined && (tuningHz < 400 || tuningHz > 480)) {
      throw new BadRequestException('Tuning Hz must be between 400 and 480');
    }
    if (
      instrument !== undefined &&
      instrument.trim().length > 0 &&
      instrument.trim().length > 50
    ) {
      throw new BadRequestException(
        'Instrument name cannot exceed 50 characters',
      );
    }

    const updateFields: Record<string, unknown> = {};
    if (defaultBpm !== undefined) {
      updateFields['preferences.defaultBpm'] = defaultBpm;
    }
    if (tuningHz !== undefined) {
      updateFields['preferences.tuningHz'] = tuningHz;
    }
    if (instrument !== undefined) {
      updateFields['preferences.instrument'] = instrument.trim();
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userId, updateFields, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.stripPassword(updatedUser);
  }

  async incrementPracticeStreak(userId: string): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastPractice = user.practiceStreak?.lastPracticeDate
      ? new Date(user.practiceStreak.lastPracticeDate)
      : null;

    if (lastPractice) {
      lastPractice.setHours(0, 0, 0, 0);
    }

    let newStreak = user.practiceStreak?.currentStreak || 0;

    if (lastPractice && lastPractice.getTime() === today.getTime()) {
      return this.stripPassword(user);
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastPractice && lastPractice.getTime() === yesterday.getTime()) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const newLongest = Math.max(
      newStreak,
      user.practiceStreak?.longestStreak || 0,
    );

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          'practiceStreak.currentStreak': newStreak,
          'practiceStreak.longestStreak': newLongest,
          'practiceStreak.lastPracticeDate': today,
        },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.stripPassword(updatedUser);
  }

  async deleteAccount(userId: string): Promise<void> {
    this.validateObjectId(userId, 'User ID');

    const deletedUser = await this.userModel.findByIdAndDelete(userId).exec();

    if (!deletedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    await Promise.all([
      this.friendshipModel
        .deleteMany({
          $or: [
            { requesterId: this.toObjectId(userId, 'User ID') },
            { receiverId: this.toObjectId(userId, 'User ID') },
          ],
        })
        .exec(),
      this.userLikedSongModel
        .deleteMany({ userId: this.toObjectId(userId, 'User ID') })
        .exec(),
      this.recentlyPlayedModel
        .deleteMany({ userId: this.toObjectId(userId, 'User ID') })
        .exec(),
    ]);
  }

  async generateResetCode(email: string): Promise<UserDocument> {
    this.validateEmail(email);

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;

    return await user.save();
  }

  async verifyResetCode(email: string, code: string): Promise<boolean> {
    this.validateEmail(email);

    if (!code || code.trim().length !== 6) {
      throw new BadRequestException('Reset code must be 6 digits');
    }

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    if (!user.resetCode || !user.resetCodeExpiry) {
      throw new BadRequestException('No reset code found for this user');
    }

    if (new Date() > user.resetCodeExpiry) {
      throw new BadRequestException('Reset code has expired');
    }

    if (user.resetCode !== code.trim()) {
      throw new BadRequestException('Invalid reset code');
    }

    return true;
  }

  async resetPassword(
    email: string,
    code: string,
    newPassword: string,
  ): Promise<void> {
    await this.verifyResetCode(email, code);
    this.validatePassword(newPassword);

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const hashedPassword: string = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetCode = undefined;
    user.resetCodeExpiry = undefined;

    await user.save();
  }
}
