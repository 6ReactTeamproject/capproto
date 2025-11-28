// 참여 신청 컨트롤러 - 참여 신청 엔드포인트
import { Controller, Post, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('projects/:projectId/applications')
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('projectId') projectId: string,
    @Body() createApplicationDto: CreateApplicationDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.create(projectId, user.id, createApplicationDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findByProject(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.findByProject(projectId, user.id);
  }
}

@Controller('applications')
export class ApplicationsStatusController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  @Put(':id/accept')
  @UseGuards(JwtAuthGuard)
  async accept(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.updateStatus(id, 'ACCEPTED', user.id);
  }

  @Put(':id/reject')
  @UseGuards(JwtAuthGuard)
  async reject(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.updateStatus(id, 'REJECTED', user.id);
  }
}
