import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs') as typeof import('bcryptjs');

export type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  // Helper: Strip password from user document
  private stripPassword(user: UserDocument): UserWithoutPassword {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userObj = user.toObject();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
    const { password: _pwd, ...userWithoutPassword } = userObj;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return userWithoutPassword;
  }

  // Helper: Validate ObjectId format
  private validateObjectId(id: string, fieldName = 'ID'): void {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException(`Invalid ${fieldName} format`);
    }
  }

  // Helper: Validate email format
  private validateEmail(email: string): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Invalid email format');
    }
  }

  // Helper: Validate password strength
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException(
        'Password must be at least 8 characters long',
      );
    }
  }

  // Create new user with validation and duplicate checking
  async create(
    username: string,
    email: string,
    password: string,
  ): Promise<UserWithoutPassword> {
    // Validation
    if (!username || username.trim().length < 3) {
      throw new BadRequestException(
        'Username must be at least 3 characters long',
      );
    }
    this.validateEmail(email);
    this.validatePassword(password);

    // Check for existing user
    const existingUser = await this.userModel
      .findOne({
        $or: [{ email: email.toLowerCase() }, { username }],
      })
      .exec();

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        throw new ConflictException('Email already registered');
      }
      if (existingUser.username === username) {
        throw new ConflictException('Username already taken');
      }
    }

    try {
      const hashedPassword: string = await bcrypt.hash(password, 10);

      const newUser = new this.userModel({
        username: username.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      });

      const savedUser = await newUser.save();
      return this.stripPassword(savedUser);
    } catch (error) {
      // Handle MongoDB duplicate key error (race condition)
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

  async addLikedSong(
    userId: string,
    songId: string,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(songId, 'Song ID');

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $addToSet: { likedSongIds: new Types.ObjectId(songId) } },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.stripPassword(updatedUser);
  }

  async removeLikedSong(
    userId: string,
    songId: string,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(songId, 'Song ID');

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $pull: { likedSongIds: new Types.ObjectId(songId) } },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.stripPassword(updatedUser);
  }

  async addRecentlyPlayed(
    userId: string,
    songId: string,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');
    this.validateObjectId(songId, 'Song ID');

    const recentlyPlayedEntry = {
      songId: new Types.ObjectId(songId),
      playedAt: new Date(),
    };

    const updatedUser = await this.userModel
      .findByIdAndUpdate(
        userId,
        {
          $push: {
            recentlyPlayed: {
              $each: [recentlyPlayedEntry],
              $slice: -20, // Keep only the latest 20 entries
            },
          },
        },
        { new: true },
      )
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    return this.stripPassword(updatedUser);
  }

  async updatePracticeGoals(
    userId: string,
    dailyMinutes: number,
    weeklyDays: number,
  ): Promise<UserWithoutPassword> {
    this.validateObjectId(userId, 'User ID');

    // Validation
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

    // Validation
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
    if (defaultBpm !== undefined)
      updateFields['preferences.defaultBpm'] = defaultBpm;
    if (tuningHz !== undefined) updateFields['preferences.tuningHz'] = tuningHz;
    if (instrument !== undefined)
      updateFields['preferences.instrument'] = instrument.trim();

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

    // Check if already practiced today
    if (lastPractice && lastPractice.getTime() === today.getTime()) {
      // Already practiced today, don't update
      return this.stripPassword(user);
    }

    // Check if practiced yesterday (streak continues)
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastPractice && lastPractice.getTime() === yesterday.getTime()) {
      newStreak += 1;
    } else {
      // Streak broken, reset to 1
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
  }

  async generateResetCode(email: string): Promise<UserDocument> {
    this.validateEmail(email);

    const user = await this.userModel
      .findOne({ email: email.toLowerCase() })
      .exec();

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry to 15 minutes from now
    const resetCodeExpiry = new Date(Date.now() + 15 * 60 * 1000);

    user.resetCode = resetCode;
    user.resetCodeExpiry = resetCodeExpiry;

    return await user.save();
  }
}
