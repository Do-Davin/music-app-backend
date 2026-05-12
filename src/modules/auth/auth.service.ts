import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './strategies/jwt.strategy';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);

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

    // In production, send email with reset code
    // For now, return success message
    // Note: The actual reset code is NOT returned for security

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
