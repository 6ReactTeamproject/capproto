// 참여 신청 서비스 - 프로젝트 참여 신청 관리
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, userId: string, createApplicationDto: CreateApplicationDto) {
    // 프로젝트 존재 확인
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 중복 신청 체크
    const existingApplication = await this.prisma.projectApplication.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException('이미 참여 신청한 프로젝트입니다.');
    }

    // 참여 신청 생성
    const application = await this.prisma.projectApplication.create({
      data: {
        projectId,
        userId,
        message: createApplicationDto.message,
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return application;
  }

  // 프로젝트별 참여 신청 목록 조회 (creator만 접근 가능)
  async findByProject(projectId: string, creatorId: string) {
    // 프로젝트 존재 및 권한 확인
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    if (project.creatorId !== creatorId) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 참여 신청 목록 조회
    const applications = await this.prisma.projectApplication.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
            techStacks: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications.map((app) => ({
      ...app,
      user: {
        ...app.user,
        techStacks: JSON.parse(app.user.techStacks || '[]'),
      },
    }));
  }

  // 참여 신청 수락/거절
  async updateStatus(
    applicationId: string,
    status: 'ACCEPTED' | 'REJECTED',
    creatorId: string,
  ) {
    const application = await this.prisma.projectApplication.findUnique({
      where: { id: applicationId },
      include: {
        project: true,
      },
    });

    if (!application) {
      throw new NotFoundException('참여 신청을 찾을 수 없습니다.');
    }

    // 프로젝트 생성자만 수정 가능
    if (application.project.creatorId !== creatorId) {
      throw new NotFoundException('참여 신청을 찾을 수 없습니다.');
    }

    return this.prisma.projectApplication.update({
      where: { id: applicationId },
      data: { status },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
          },
        },
      },
    });
  }
}
