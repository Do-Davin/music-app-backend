import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './entities/auth.entity';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { SendResetCodeInput } from './dto/send-reset-code.input';
import { ResetCodeResponse } from './entities/reset-code.entity';
import { VerifyCodeInput } from './dto/verify-code.input';
import { VerifyCodeResponse } from './entities/verify-code.entity';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ResetPasswordResponse } from './entities/reset-password.entity';
import { GqlThrottlerGuard } from './guards/gql-throttler.guard';

@Resolver()
@UseGuards(GqlThrottlerGuard)
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  // 3 register attempts per 60 seconds
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Mutation(() => AuthResponse)
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(
      input.username,
      input.email,
      input.password,
    );
  }

  // IP-based Rate Limit: Max 20 attempts per 60 seconds (protects the server from DoS/Spam)
  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    const email = input.email;
    const password = input.password;
    return this.authService.login(email, password);
  }

  @Mutation(() => AuthResponse)
  async refreshToken(
    @Args('input') input: RefreshTokenInput,
  ): Promise<AuthResponse> {
    const { refreshToken } = input;
    return await this.authService.refreshToken(refreshToken);
  }

  // 2 sendResetCode requests per 60 seconds (protects Brevo email quota)
  @Throttle({ default: { ttl: 60000, limit: 2 } })
  @Mutation(() => ResetCodeResponse)
  async sendResetCode(
    @Args('input') input: SendResetCodeInput,
  ): Promise<ResetCodeResponse> {
    return this.authService.sendResetCode(input.email);
  }

  // 5 verifyCode attempts per 60 seconds
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Mutation(() => VerifyCodeResponse)
  async verifyCode(
    @Args('input') input: VerifyCodeInput,
  ): Promise<VerifyCodeResponse> {
    return this.authService.verifyCode(input.email, input.code);
  }

  // 3 resetPassword attempts per 60 seconds
  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Mutation(() => ResetPasswordResponse)
  async resetPassword(
    @Args('input') input: ResetPasswordInput,
  ): Promise<ResetPasswordResponse> {
    return this.authService.resetPassword(
      input.email,
      input.code,
      input.newPassword,
    );
  }
}

