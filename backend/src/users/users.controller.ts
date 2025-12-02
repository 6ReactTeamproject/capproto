// 사용자 컨트롤러 - 사용자 정보 조회 엔드포인트
import {
  Controller,
  Get,
  Param,
  UseGuards,
  BadRequestException,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { GitHubService } from "./github.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly githubService: GitHubService
  ) {}

  @Get("me/projects")
  @UseGuards(JwtAuthGuard)
  async getMyProjects(@CurrentUser() user: any) {
    return this.usersService.getMyProjects(user.id);
  }

  @Get("me/applications")
  @UseGuards(JwtAuthGuard)
  async getMyApplications(@CurrentUser() user: any) {
    return this.usersService.getMyApplications(user.id);
  }

  @Get("me/mypage")
  @UseGuards(JwtAuthGuard)
  async getMyPageInfo(@CurrentUser() user: any) {
    return this.usersService.getMyPageInfo(user.id);
  }

  @Get(":id/projects")
  async getUserProjects(@Param("id") id: string) {
    return this.usersService.getMyProjects(id);
  }

  @Get(":id")
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Get("me/github-stats")
  @UseGuards(JwtAuthGuard)
  async getMyGithubStats(@CurrentUser() user: any) {
    /**
     * ⚠️ 이 엔드포인트는 JWT에 GitHub 연동 정보가 들어있다는 전제입니다.
     * - githubUsername / githubLogin / username 중 하나에서 GitHub 사용자명을 찾고,
     * - githubAccessToken / githubToken 중 하나에서 GitHub OAuth 토큰을 찾습니다.
     *
     * 실제 프로젝트에서 JWT 페이로드에 들어있는 필드명에 맞게 아래 부분을 수정해 주세요.
     */

    const githubUsername =
      user.githubUsername || user.githubLogin || user.username || null;
    const githubAccessToken =
      user.githubAccessToken || user.githubToken || null;

    if (!githubUsername) {
      throw new BadRequestException(
        "GitHub 연동: JWT에 GitHub 사용자명(githubUsername/githubLogin/username)이 없습니다. GitHub 계정 연동 후 다시 시도해 주세요."
      );
    }

    if (!githubAccessToken) {
      throw new BadRequestException(
        "GitHub 연동: JWT에 GitHub OAuth access token(githubAccessToken/githubToken)이 없습니다. 로그인/연동 로직에서 토큰을 JWT에 포함하도록 수정하세요."
      );
    }

    // forceRefresh = true 로 캐시를 무시하고 매번 최신 데이터를 가져오도록 설정
    return this.githubService.getUserStats(
      githubUsername,
      githubAccessToken,
      true
    );
  }
}
