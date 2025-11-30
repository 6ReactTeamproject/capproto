// 사용자 모듈
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { GitHubService } from './github.service';

@Module({
  imports: [ConfigModule],
  controllers: [UsersController],
  providers: [UsersService, GitHubService],
  exports: [UsersService],
})
export class UsersModule {}
