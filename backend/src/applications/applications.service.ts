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

  // 프로젝트 생성자가 특정 사용자 초대 (참여 신청 생성)
  async invite(projectId: string, invitedUserId: string, creatorId: string, message?: string) {
    // 프로젝트 존재 및 권한 확인
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 프로젝트 생성자만 초대 가능
    if (project.creatorId !== creatorId) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 초대받는 사용자 존재 확인
    const invitedUser = await this.prisma.user.findUnique({
      where: { id: invitedUserId },
    });

    if (!invitedUser) {
      throw new NotFoundException('초대할 사용자를 찾을 수 없습니다.');
    }

    // 자기 자신은 초대할 수 없음
    if (invitedUserId === creatorId) {
      throw new ConflictException('자기 자신은 초대할 수 없습니다.');
    }

    // 중복 신청 체크
    const existingApplication = await this.prisma.projectApplication.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId: invitedUserId,
        },
      },
    });

    if (existingApplication) {
      throw new ConflictException('이미 참여 신청이 있거나 초대된 사용자입니다.');
    }

    // 초대 생성 (참여 신청으로 생성, 상태는 PENDING)
    const application = await this.prisma.projectApplication.create({
      data: {
        projectId,
        userId: invitedUserId,
        message: message || '프로젝트 생성자가 초대했습니다.',
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
