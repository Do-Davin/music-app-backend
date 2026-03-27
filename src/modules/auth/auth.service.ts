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
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }

  async register(username: string, email: string, password: string) {
    const user = await this.usersService.create(username, email, password);

    const payload: JwtPayload = {
      sub: user._id.toString(),
      email: user.email,
      username: user.username,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}
