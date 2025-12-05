// 프로젝트 서비스 - 프로젝트 CRUD 및 추천 기능
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from "@nestjs/common";
import { PrismaService } from "../common/prisma/prisma.service";
import { CreateProjectDto } from "./dto/create-project.dto";

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
        startDate: createProjectDto.startDate
          ? new Date(createProjectDto.startDate)
          : null,
        endDate: createProjectDto.endDate
          ? new Date(createProjectDto.endDate)
          : null,
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
        orderBy: { createdAt: "desc" },
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
        isRecruiting: project.isRecruiting ?? true, // 기본값 true
      })),
      total,
      page,
      limit,
    };
  }

  async findOne(id: string, userId?: string) {
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
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 현재 사용자의 참여 신청 상태 확인
    let hasApplied = false;
    let isAccepted = false;
    if (userId) {
      const application = await this.prisma.projectApplication.findUnique({
        where: {
          projectId_userId: {
            projectId: id,
            userId,
          },
        },
      });
      hasApplied = !!application;
      isAccepted = application?.status === 'ACCEPTED';
    }

    return {
      ...project,
      neededRoles: JSON.parse(project.neededRoles),
      requiredStacks: JSON.parse(project.requiredStacks),
      isRecruiting: project.isRecruiting ?? true, // 기본값 true
      creator: {
        ...project.creator,
        techStacks: JSON.parse(project.creator.techStacks || "[]"),
      },
      hasApplied,
      isAccepted, // 수락된 신청 여부
    };
  }

  // 추천 팀원 목록 - 전체 유저 대상으로 매칭 점수 계산 (creator만 접근 가능)
  async getRecommendations(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 프로젝트 생성자만 접근 가능
    if (project.creatorId !== userId) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    const requiredStacks = JSON.parse(
      project.requiredStacks || "[]"
    ) as string[];
    const neededRoles = JSON.parse(project.neededRoles || "[]") as string[];

    // 모든 사용자 조회 (전체 유저 대상, 자기 자신 제외)
    const allUsers = await this.prisma.user.findMany({
      where: {
        id: { not: userId }, // 자기 자신 제외
      },
      select: {
        id: true,
        nickname: true,
        role: true,
        techStacks: true,
        portfolioLinks: true,
        experience: true,
      },
    });

    // 매칭 점수 계산 (1~100점) - 역할별로 다른 평가 기준 적용
    const usersWithScores = allUsers
      .map((user) => {
        const userStacks = JSON.parse(user.techStacks || "[]") as string[];
        const portfolioLinks = JSON.parse(user.portfolioLinks || "[]") as string[];
        const experience = JSON.parse(user.experience || "[]") as Array<{
          title: string;
          role: string;
          period: string;
          description: string;
        }>;
        
        let techScore = 0;
        let roleScore = 0;
        let portfolioScore = 0;
        let experienceScore = 0;

        // 역할 매칭 점수 계산 (모든 역할 공통, 0~20점)
        if (neededRoles.length > 0 && neededRoles.includes(user.role)) {
          roleScore = 20;
        }

        // 역할별 평가 로직 분기
        if (user.role === "DEVELOPER") {
          // 개발자: 기술 스택 매칭 (0~80점)
          if (requiredStacks.length > 0) {
            const intersection = requiredStacks.filter((stack) =>
              userStacks.includes(stack)
            );
            techScore = (intersection.length / requiredStacks.length) * 80;
          }
        } else if (user.role === "DESIGNER") {
          // 디자이너: 포트폴리오 링크 (0~30점), 경력 (0~30점), 디자인 도구 경험 (0~20점)
          if (portfolioLinks.length > 0) {
            portfolioScore = Math.min(30, portfolioLinks.length * 10); // 링크 1개당 10점, 최대 30점
          }
          if (experience.length > 0) {
            experienceScore = Math.min(30, experience.length * 10); // 경력 1개당 10점, 최대 30점
          }
          // 디자인 도구 경험 (Figma, Adobe 등)
          const designTools = ["Figma", "Adobe XD", "Sketch", "Photoshop", "Illustrator"];
          const userDesignTools = userStacks.filter((stack) =>
            designTools.some((tool) => stack.includes(tool))
          );
          if (userDesignTools.length > 0) {
            techScore = (userDesignTools.length / designTools.length) * 20;
          }
        } else if (user.role === "PLANNER") {
          // 기획자: 포트폴리오/문서 링크 (0~30점), 경력 (0~30점), 기획 도구 경험 (0~20점)
          if (portfolioLinks.length > 0) {
            portfolioScore = Math.min(30, portfolioLinks.length * 10); // 링크 1개당 10점, 최대 30점
          }
          if (experience.length > 0) {
            experienceScore = Math.min(30, experience.length * 10); // 경력 1개당 10점, 최대 30점
          }
          // 기획 도구 경험 (Notion, Figma, 문서 도구 등)
          const planningTools = ["Notion", "Figma", "Miro", "Confluence", "Jira"];
          const userPlanningTools = userStacks.filter((stack) =>
            planningTools.some((tool) => stack.includes(tool))
          );
          if (userPlanningTools.length > 0) {
            techScore = (userPlanningTools.length / planningTools.length) * 20;
          }
        }

        // 총합 점수 계산 (1~100점으로 정규화)
        let totalScore = techScore + roleScore + portfolioScore + experienceScore;
        
        // 최소 1점, 최대 100점으로 제한
        totalScore = Math.max(1, Math.min(100, Math.round(totalScore)));
        
        // 소수점 둘째 자리까지 반올림
        totalScore = Math.round(totalScore * 100) / 100;

        return {
          userId: user.id,
          nickname: user.nickname,
          role: user.role,
          techStacks: userStacks,
          portfolioLinks: portfolioLinks,
          experience: experience,
          score: totalScore,
          techScore: Math.round(techScore * 100) / 100,
          roleScore: Math.round(roleScore * 100) / 100,
          portfolioScore: Math.round(portfolioScore * 100) / 100,
          experienceScore: Math.round(experienceScore * 100) / 100,
        };
      })
      .filter((user) => user.score > 0) // 점수가 0보다 큰 사용자만
      .sort((a, b) => b.score - a.score) // 점수 내림차순 정렬
      .slice(0, 5); // 상위 5명

    return usersWithScores;
  }

  // 모집 종료 (생성자만 가능)
  async closeRecruitment(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 프로젝트 생성자만 모집 종료 가능
    if (project.creatorId !== userId) {
      throw new ForbiddenException("모집을 종료할 권한이 없습니다.");
    }

    // 이미 모집 종료된 경우
    if (!project.isRecruiting) {
      throw new ConflictException("이미 모집이 종료된 프로젝트입니다.");
    }

    // 모집 종료
    await this.prisma.project.update({
      where: { id: projectId },
      data: { isRecruiting: false },
    });

    return { message: "모집이 종료되었습니다." };
  }

  // 프로젝트 삭제 (생성자만 가능)
  async delete(projectId: string, userId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException("프로젝트를 찾을 수 없습니다.");
    }

    // 프로젝트 생성자만 삭제 가능
    if (project.creatorId !== userId) {
      throw new ForbiddenException("프로젝트를 삭제할 권한이 없습니다.");
    }

    // 프로젝트 삭제 (관련 데이터는 CASCADE로 자동 삭제됨)
    await this.prisma.project.delete({
      where: { id: projectId },
    });

    return { message: "프로젝트가 삭제되었습니다." };
  }
}
