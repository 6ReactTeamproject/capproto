// 인증 컨트롤러 - 회원가입, 로그인 엔드포인트
import { Controller, Post, Body, Get, Put, UseGuards, Req, Res } from "@nestjs/common";
import { Request, Response } from "express";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { GitHubAuthGuard } from "./guards/github-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async getMe(@CurrentUser() user: any) {
    return this.authService.getCurrentUser(user.id);
  }

  @Put("me")
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: any,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateProfile(user.id, updateUserDto);
  }

  // GitHub OAuth 시작
  @Get("github")
  @UseGuards(GitHubAuthGuard)
  async githubAuth() {
    // GitHubAuthGuard에서 환경 변수를 확인한 후 Passport가 자동으로 GitHub 인증 페이지로 리다이렉트
  }

  // GitHub OAuth 콜백
  @Get("github/callback")
  @UseGuards(GitHubAuthGuard)
  async githubCallback(@Req() req: Request, @Res() res: Response) {
    // GitHubStrategy의 validate 메서드에서 반환한 user 정보
    const result = req.user as any;
    
    if (!result || !result.accessToken) {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL') || "http://localhost:3000";
      return res.redirect(`${frontendUrl}/auth/callback?error=github_auth_failed`);
    }
    
    // 프론트엔드로 리다이렉트 (토큰을 쿼리 파라미터로 전달)
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || "http://localhost:3000";
    const redirectUrl = `${frontendUrl}/auth/callback?token=${result.accessToken}`;
    
    res.redirect(redirectUrl);
  }

  // 기존 사용자의 GitHub 연동
  @Post("github/link")
  @UseGuards(JwtAuthGuard)
  async linkGitHub(
    @CurrentUser() user: any,
    @Body() body: { code: string },
  ) {
    // GitHub OAuth code를 받아서 access token을 얻고, 사용자 정보를 가져온 후 연동
    // 실제 구현에서는 GitHub API를 호출하여 code를 access token으로 교환하고
    // 사용자 정보를 가져와야 합니다.
    // 여기서는 간단히 GitHubStrategy를 재사용하는 방식으로 구현할 수 있지만,
    // 더 나은 방법은 별도의 GitHub API 호출 로직을 만드는 것입니다.
    
    // 임시로 에러를 반환 (실제 구현 필요)
    throw new Error("GitHub 연동 기능은 아직 구현 중입니다. GitHub 로그인을 통해 자동으로 연동됩니다.");
  }
}
