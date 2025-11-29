// 사용자 컨트롤러 - 사용자 정보 조회 엔드포인트
import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Get('me/projects')
  @UseGuards(JwtAuthGuard)
  async getMyProjects(@CurrentUser() user: any) {
    return this.usersService.getMyProjects(user.id);
  }

  @Get('me/applications')
  @UseGuards(JwtAuthGuard)
  async getMyApplications(@CurrentUser() user: any) {
    return this.usersService.getMyApplications(user.id);
  }

  @Get('me/mypage')
  @UseGuards(JwtAuthGuard)
  async getMyPageInfo(@CurrentUser() user: any) {
    return this.usersService.getMyPageInfo(user.id);
  }
}
