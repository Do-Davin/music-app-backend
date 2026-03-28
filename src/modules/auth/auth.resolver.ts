import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './entities/auth.entity';
import { LoginInput } from './dto/login.input';
import { RefreshTokenInput } from './dto/refresh-token.input';
import { SendResetCodeInput } from './dto/send-reset-code.input';
import { ResetCodeResponse } from './entities/reset-code.entity';
import { VerifyCodeInput } from './dto/verify-code.input';
import { VerifyCodeResponse } from './entities/verify-code.entity';

@Resolver()
export class AuthResolver {
  constructor(private readonly authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async register(@Args('input') input: RegisterInput): Promise<AuthResponse> {
    return this.authService.register(
      input.username,
      input.email,
      input.password,
    );
  }

  @Mutation(() => AuthResponse)
  async login(@Args('input') input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;
    return this.authService.login(email, password);
  }

  @Mutation(() => AuthResponse)
  async refreshToken(
    @Args('input') input: RefreshTokenInput,
  ): Promise<AuthResponse> {
    const { refreshToken } = input;
    return await this.authService.refreshToken(refreshToken);
  }

  @Mutation(() => ResetCodeResponse)
  async sendResetCode(
    @Args('input') input: SendResetCodeInput,
  ): Promise<ResetCodeResponse> {
    return this.authService.sendResetCode(input.email);
  }

  @Mutation(() => VerifyCodeResponse)
  async verifyCode(
    @Args('input') input: VerifyCodeInput,
  ): Promise<VerifyCodeResponse> {
    return this.authService.verifyCode(input.email, input.code);
  }
}
