// 프로젝트 컨트롤러 - 프로젝트 CRUD 및 추천 엔드포인트
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../common/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @CurrentUser() user?: any,
  ) {
    return this.projectsService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
      user?.id,
    );
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createProjectDto: CreateProjectDto,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.create(createProjectDto, user.id);
  }

  // 더 구체적인 라우트를 먼저 정의
  @Get(':id/recommendations')
  @UseGuards(JwtAuthGuard)
  async getRecommendations(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.getRecommendations(id, user.id);
  }

  @Put(':id/close-recruitment')
  @UseGuards(JwtAuthGuard)
  async closeRecruitment(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.closeRecruitment(id, user.id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user?: any,
  ) {
    return this.projectsService.findOne(id, user?.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.projectsService.delete(id, user.id);
  }
}
