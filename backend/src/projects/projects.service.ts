// 프로젝트 서비스 - 프로젝트 CRUD 및 추천 기능
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto, creatorId: string) {
    const project = await this.prisma.project.create({
      data: {
        title: createProjectDto.title,
        shortDescription: createProjectDto.shortDescription,
        neededRoles: JSON.stringify(createProjectDto.neededRoles),
        requiredStacks: JSON.stringify(createProjectDto.requiredStacks),
        creatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            role: true,
          },
        },
      },
    });

    return {
      ...project,
      neededRoles: JSON.parse(project.neededRoles),
      requiredStacks: JSON.parse(project.requiredStacks),
    };
  }

  async findAll(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: {
            select: {
              id: true,
              nickname: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.project.count(),
    ]);

    return {
      data: projects.map((project) => ({
        ...project,
        neededRoles: JSON.parse(project.neededRoles),
        requiredStacks: JSON.parse(project.requiredStacks),
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        creator: {
          select: {
            id: true,
            nickname: true,
            role: true,
            techStacks: true,
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    return {
      ...project,
      neededRoles: JSON.parse(project.neededRoles),
      requiredStacks: JSON.parse(project.requiredStacks),
      creator: {
        ...project.creator,
        techStacks: JSON.parse(project.creator.techStacks || '[]'),
      },
    };
  }

  // 추천 팀원 목록 - 전체 유저 대상으로 매칭 점수 계산 (creator만 접근 가능)
  async getRecommendations(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 프로젝트 생성자만 접근 가능
    if (project.creatorId !== userId) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    const requiredStacks = JSON.parse(project.requiredStacks || '[]') as string[];

    // 모든 사용자 조회 (전체 유저 대상)
    const allUsers = await this.prisma.user.findMany({
      select: {
        id: true,
        nickname: true,
        role: true,
        techStacks: true,
      },
    });

    // 매칭 점수 계산
    const usersWithScores = allUsers
      .map((user) => {
        const userStacks = JSON.parse(user.techStacks || '[]') as string[];
        // 교집합 개수 계산
        const intersection = requiredStacks.filter((stack) =>
          userStacks.includes(stack),
        );
        const score = intersection.length;

        return {
          userId: user.id,
          nickname: user.nickname,
          role: user.role,
          techStacks: userStacks,
          score,
        };
      })
      .filter((user) => user.score > 0) // 점수가 0보다 큰 사용자만
      .sort((a, b) => b.score - a.score) // 점수 내림차순 정렬
      .slice(0, 5); // 상위 5명

    return usersWithScores;
  }
}
