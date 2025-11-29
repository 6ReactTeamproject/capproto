// 사용자 서비스 - 사용자 정보 조회
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nickname: true,
        role: true,
        techStacks: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    return user;
  }

  // 내가 생성한 프로젝트 목록
  async getMyProjects(userId: string) {
    const projects = await this.prisma.project.findMany({
      where: { creatorId: userId },
      include: {
        applications: {
          select: {
            id: true,
            status: true,
            user: {
              select: {
                id: true,
                nickname: true,
                role: true,
              },
            },
          },
        },
        chatRoom: {
          select: {
            id: true,
            messages: {
              select: {
                id: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((project) => ({
      ...project,
      applicationCount: project.applications.length,
      messageCount: project.chatRoom?.messages.length || 0,
    }));
  }

  // 내가 참여 신청한 프로젝트 목록
  async getMyApplications(userId: string) {
    const applications = await this.prisma.projectApplication.findMany({
      where: { userId },
      include: {
        project: {
          include: {
            creator: {
              select: {
                id: true,
                nickname: true,
                role: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return applications;
  }

  // 마이페이지 통합 정보
  async getMyPageInfo(userId: string) {
    const user = await this.findOne(userId);
    const myProjects = await this.getMyProjects(userId);
    const myApplications = await this.getMyApplications(userId);

    return {
      user,
      myProjects,
      myApplications,
      stats: {
        createdProjectsCount: myProjects.length,
        appliedProjectsCount: myApplications.length,
        pendingApplicationsCount: myApplications.filter((app) => app.status === 'PENDING').length,
        acceptedApplicationsCount: myApplications.filter((app) => app.status === 'ACCEPTED').length,
      },
    };
  }
}
