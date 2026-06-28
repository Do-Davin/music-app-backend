import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as nodemailer from 'nodemailer';
import { JwtPayload } from './strategies/jwt.strategy';

interface LoginAttemptRecord {
  failedAttempts: number;
  lockoutCount: number; // how many times the user has been locked out (used for doubling)
  lockedUntil: number | null; // timestamp in ms
}

@Injectable()
export class AuthService {
  private loginAttempts = new Map<string, LoginAttemptRecord>();

  private static readonly MAX_ATTEMPTS = 5;
  private static readonly BASE_LOCKOUT_SECONDS = 60; // 1 minute

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  private getAttemptRecord(email: string): LoginAttemptRecord {
    const key = email.toLowerCase();
    if (!this.loginAttempts.has(key)) {
      this.loginAttempts.set(key, {
        failedAttempts: 0,
        lockoutCount: 0,
        lockedUntil: null,
      });
    }
    return this.loginAttempts.get(key)!;
  }

  async validateUser(email: string, password: string) {
    return this.usersService.validateUser(email, password);
  }

  async login(email: string, password: string) {
    const record = this.getAttemptRecord(email);

    // Check if the account is currently locked out
    if (record.lockedUntil && Date.now() < record.lockedUntil) {
      const remainingSeconds = Math.ceil(
        (record.lockedUntil - Date.now()) / 1000,
      );
      throw new ForbiddenException(
        JSON.stringify({
          message: `Too many failed attempts. Try again in ${remainingSeconds} seconds.`,
          lockoutSeconds: remainingSeconds,
        }),
      );
    }

    // If lockout has expired, reset the failed attempts (but keep lockoutCount for doubling)
    if (record.lockedUntil && Date.now() >= record.lockedUntil) {
      record.failedAttempts = 0;
      record.lockedUntil = null;
    }

    try {
      const user = await this.validateUser(email, password);

      // Success — reset everything for this email
      this.loginAttempts.delete(email.toLowerCase());

      const payload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        username: user.username,
      };

      return {
        accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
        refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
        user,
      };
    } catch (error) {
      // Failed login — increment counter
      record.failedAttempts++;

      if (record.failedAttempts >= AuthService.MAX_ATTEMPTS) {
        // Lock the account with exponential backoff
        record.lockoutCount++;
        const lockoutSeconds =
          AuthService.BASE_LOCKOUT_SECONDS *
          Math.pow(2, record.lockoutCount - 1);
        record.lockedUntil = Date.now() + lockoutSeconds * 1000;
        record.failedAttempts = 0;

        throw new ForbiddenException(
          JSON.stringify({
            message: `Too many failed attempts. Try again in ${lockoutSeconds} seconds.`,
            lockoutSeconds,
          }),
        );
      }

      const remaining = AuthService.MAX_ATTEMPTS - record.failedAttempts;
      const originalMessage =
        error instanceof UnauthorizedException
          ? error.message
          : 'Invalid credentials';
      throw new UnauthorizedException(
        `${originalMessage}. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`,
      );
    }
  }

  async register(
    username: string | undefined,
    email: string,
    password: string,
  ) {
    const user = await this.usersService.create(username, email, password);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '7d' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
      user,
    };
  }

  async refreshToken(token: string) {
    try {
      const payload = this.jwtService.verify<JwtPayload>(token);

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload: JwtPayload = {
        sub: user._id.toString(),
        email: user.email,
        username: user.username,
      };

      // eslint-disable-next-line @typescript-eslint/no-unused-vars, @typescript-eslint/no-unsafe-assignment
      const { password: _pwd, ...userWithoutPassword } = user.toObject();

      return {
        accessToken: this.jwtService.sign(newPayload, { expiresIn: '7d' }),
        refreshToken: this.jwtService.sign(newPayload, { expiresIn: '30d' }),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        user: userWithoutPassword,
      };
    } catch (error) {
      throw new UnauthorizedException(
        `Invalid or expired refresh token: ${error}`,
      );
    }
  }

  async sendResetCode(email: string) {
    const user = await this.usersService.generateResetCode(email);

    let transporter: nodemailer.Transporter;
    
    if (process.env.SMTP_HOST) {
      transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } else {
      // Fallback for development testing using Ethereal Email
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    try {
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Music App" <VibeFlow@musicapp.com>',
        to: email,
        subject: 'Password Reset Code',
        text: `Your password reset code is: ${user.resetCode}. It expires in 1 minute.`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Reset Your Password</title>
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                background-color: #121212;
                color: #ffffff;
                margin: 0;
                padding: 0;
              }
              .container {
                max-width: 480px;
                margin: 40px auto;
                background-color: #1e1e1e;
                border-radius: 16px;
                border: 1px solid #2a2a2a;
                overflow: hidden;
                box-shadow: 0 8px 30px rgba(0, 0, 0, 0.5);
              }
              .header {
                background-color: #1e1e1e;
                padding: 32px 24px 20px;
                text-align: center;
                border-bottom: 1px solid #2a2a2a;
              }
              .logo-text {
                font-size: 24px;
                font-weight: 700;
                color: #ff9800;
                letter-spacing: 1px;
              }
              .content {
                padding: 32px 24px;
                text-align: center;
              }
              h1 {
                font-size: 22px;
                font-weight: 600;
                margin-top: 0;
                margin-bottom: 16px;
                color: #ffffff;
              }
              p {
                font-size: 15px;
                line-height: 1.6;
                color: #b3b3b3;
                margin-top: 0;
                margin-bottom: 24px;
              }
              .code-container {
                background-color: #2a2a2a;
                border-radius: 12px;
                padding: 16px;
                margin: 28px 0;
                border: 1px solid #3a3a3a;
                display: inline-block;
              }
              .code {
                font-family: 'Courier New', Courier, monospace;
                font-size: 32px;
                font-weight: 700;
                letter-spacing: 6px;
                color: #ff9800;
              }
              .expiry-text {
                font-size: 13px;
                color: #ff5252;
                font-weight: 600;
                margin-top: 12px;
              }
              .footer {
                background-color: #1a1a1a;
                padding: 24px;
                text-align: center;
                font-size: 12px;
                color: #666666;
                border-top: 1px solid #2a2a2a;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo-text">🎵 VibeFlow</div>
              </div>
              <div class="content">
                <h1>Reset Your Password</h1>
                <p>We received a request to reset the password for your account. Use the verification code below to proceed:</p>
                
                <div class="code-container">
                  <div class="code">${user.resetCode}</div>
                </div>
                
                <p class="expiry-text">⚠️ This code expires in 1 minute.</p>
                
                <p style="font-size: 13px; color: #888888; margin-top: 24px; line-height: 1.5;">
                  If you did not request this password reset, you can safely ignore this email.
                </p>
              </div>
              <div class="footer">
                &copy; 2026 VibeFlow. All rights reserved.<br>
                Practice smarter. Play better.
              </div>
            </div>
          </body>
          </html>
        `,
      });

      if (!process.env.SMTP_HOST) {
        console.log('Test email preview URL: %s', nodemailer.getTestMessageUrl(info));
      }
    } catch (error) {
      console.error('Error sending email:', error);
      throw new InternalServerErrorException(
        'Failed to send reset code email. Please try again later.',
      );
    }

    return {
      message: 'Reset code sent to email',
      email: user.email,
    };
  }

  async verifyCode(email: string, code: string) {
    const isValid = await this.usersService.verifyResetCode(email, code);

    return {
      valid: isValid,
      message: isValid ? 'Code verified successfully' : 'Invalid code',
    };
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    await this.usersService.resetPassword(email, code, newPassword);

    return {
      success: true,
      message: 'Password reset successfully',
    };
  }
}
