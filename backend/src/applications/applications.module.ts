// 참여 신청 모듈
import { Module } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationsController, ApplicationsStatusController } from './applications.controller';

@Module({
  controllers: [ApplicationsController, ApplicationsStatusController],
  providers: [ApplicationsService],
  exports: [ApplicationsService],
})
export class ApplicationsModule {}
