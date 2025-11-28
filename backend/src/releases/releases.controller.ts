// 릴리즈 컨트롤러 - 릴리즈 정보 API 엔드포인트
import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ReleasesService } from './releases.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('releases')
export class ReleasesController {
  constructor(private readonly releasesService: ReleasesService) {}

  @Get()
  async getAll() {
    return this.releasesService.getAllLatestReleases();
  }

  @Get(':language')
  async getByLanguage(@Param('language') language: string) {
    return this.releasesService.getLatestReleases(language);
  }

  @Post(':language/sync')
  @UseGuards(JwtAuthGuard)
  async syncLanguage(@Param('language') language: string) {
    try {
      await this.releasesService.syncLanguageReleases(language);
      return { message: `${language} 릴리즈 정보가 동기화되었습니다.` };
    } catch (error: any) {
      throw new Error(error.message || `${language} 릴리즈 정보 동기화에 실패했습니다.`);
    }
  }
}

