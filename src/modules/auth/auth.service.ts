import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { MailService } from '../mail/mail.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { ResetPasswordInput } from './dto/reset-password.input';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
  ) {}

  async register(input: RegisterInput) {
    const exists = await this.usersService.findByEmail(input.email);
    if (exists) throw new BadRequestException('Email already in use');

    const hashedPassword = await bcrypt.hash(input.password, 12);
    const user = await this.usersService.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      password: hashedPassword,
    });

    const accessToken = this.generateToken(user._id.toString(), user.email);
    return { accessToken, user };
  }

  async login(input: LoginInput) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isMatch = await bcrypt.compare(input.password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid email or password');

    const accessToken = this.generateToken(user._id.toString(), user.email);
    return { accessToken, user };
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('No account found with this email');

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await this.usersService.update(user._id.toString(), { otpCode, otpExpires });
    await this.mailService.sendOtpEmail(user.email, otpCode, user.fullName);

    return { success: true, message: 'OTP sent to your email' };
  }

  async verifyOtp(input: VerifyOtpInput) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) throw new NotFoundException('User not found');

    if (user.otpCode !== input.otpCode) {
      throw new BadRequestException('Invalid OTP code');
    }
    if (user.otpExpires < new Date()) {
      throw new BadRequestException('OTP code has expired');
    }

    return { success: true, message: 'OTP verified successfully' };
  }

  async resetPassword(input: ResetPasswordInput) {
    const user = await this.usersService.findByEmail(input.email);
    if (!user) throw new NotFoundException('User not found');

    if (user.otpCode !== input.otpCode) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (user.otpExpires < new Date()) {
      throw new BadRequestException('OTP code has expired');
    }

    const hashedPassword = await bcrypt.hash(input.newPassword, 12);
    await this.usersService.update(user._id.toString(), {
      password: hashedPassword,
      otpCode: null,
      otpExpires: null,
    });

    return { success: true, message: 'Password reset successfully' };
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }
}