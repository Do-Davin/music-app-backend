import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResponse, MessageResponse } from './dto/auth-response';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { ForgotPasswordInput } from './dto/forgot-password.input';
import { VerifyOtpInput } from './dto/verify-otp.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../users/schemas/user.schema';

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async register(@Args('input') input: RegisterInput) {
    return this.authService.register(input);
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput) {
    return this.authService.login(input);
  }

  @Mutation(() => MessageResponse)
  async forgotPassword(@Args('input') input: ForgotPasswordInput) {
    return this.authService.forgotPassword(input.email);
  }

  @Mutation(() => MessageResponse)
  async verifyOtp(@Args('input') input: VerifyOtpInput) {
    return this.authService.verifyOtp(input);
  }

  @Mutation(() => MessageResponse)
  async resetPassword(@Args('input') input: ResetPasswordInput) {
    return this.authService.resetPassword(input);
  }

  // Protected - requires Bearer token in Authorization header
  @Query(() => User)
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: User) {
    return user;
  }
}