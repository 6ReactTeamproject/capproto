// 참여 신청 서비스 - 프로젝트 참여 신청 관리
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ChatService } from '../chat/chat.service';

@Injectable()
export class ApplicationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => ChatService))
    private chatService: ChatService,
  ) {}

  async create(projectId: string, userId: string, createApplicationDto: CreateApplicationDto) {
    // 프로젝트 존재 확인
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 모집 중인지 확인
    if (!project.isRecruiting) {
      throw new ConflictException('모집이 종료된 프로젝트입니다.');
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
            country: true,
          },
        },
        project: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          },
        },
      },
    });

    // 프로젝트 생성자에게 시스템 메시지로 알림 전송
    try {
      const creatorId = application.project.creatorId;
      const applicant = application.user;
      
      // 생성자의 시스템 채팅방 생성 또는 조회
      const systemChatRoom = await this.chatService.getOrCreateSystemChatRoom(creatorId);

      // 알림 메시지 생성 (프로젝트 ID를 메타데이터로 포함)
      // 생성자의 국가에 맞는 언어로 메시지 생성
      const creator = await this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { country: true },
      });
      const creatorCountry = creator?.country || 'KR';
      const langMap: Record<string, string> = {
        KR: 'ko',
        US: 'en',
        JP: 'ja',
      };
      const lang = langMap[creatorCountry] || 'ko';
      
      const messages: Record<string, string> = {
        ko: '참여 신청이 들어왔습니다',
        en: 'New application received',
        ja: '参加申請が届きました',
      };
      
      const notificationMessage = JSON.stringify({
        type: 'application-notification',
        projectId: projectId,
        projectTitle: application.project.title,
        applicantName: applicant.nickname,
        message: messages[lang],
      });

      // 시스템 메시지로 저장 (senderId는 시스템 ID 사용)
      const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
      const message = await this.chatService.createMessage(
        systemChatRoom.id,
        SYSTEM_USER_ID,
        notificationMessage,
      );

      // 생성자에게 번역된 메시지 전송
      const translatedMessage = await this.chatService.translateMessageForUser(
        message,
        creatorId,
      );

      // WebSocket을 통해 실시간 알림 전송
      const messageData: any = {
        ...translatedMessage,
        userId: SYSTEM_USER_ID, // 시스템 메시지임을 표시
        roomId: systemChatRoom.id,
        metadata: {
          type: 'application-notification',
          projectId: projectId,
          projectTitle: application.project.title,
          applicantName: applicant.nickname,
        },
      };

      await this.chatService.sendDirectNotification(creatorId, messageData);
      console.log(`✅ 시스템 알림 전송 완료: ${applicant.nickname} -> ${creatorId}`);
    } catch (error) {
      // 알림 전송 실패해도 신청은 성공으로 처리
      console.error('알림 전송 실패:', error);
    }

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
            portfolioLinks: true,
            experience: true,
            githubUsername: true,
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
        portfolioLinks: JSON.parse(app.user.portfolioLinks || '[]'),
        experience: JSON.parse(app.user.experience || '[]'),
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
            country: true,
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

    // 초대받는 사용자에게 시스템 메시지로 초대 알림 전송
    try {
      // 초대받는 사용자의 시스템 채팅방 생성 또는 조회
      const systemChatRoom = await this.chatService.getOrCreateSystemChatRoom(invitedUserId);

      // 초대받는 사용자의 국가에 맞는 언어로 메시지 생성
      const invitedUserCountry = invitedUser.country || 'KR';
      const langMap: Record<string, string> = {
        KR: 'ko',
        US: 'en',
        JP: 'ja',
      };
      const lang = langMap[invitedUserCountry] || 'ko';
      
      const messages: Record<string, string> = {
        ko: '프로젝트 초대가 도착했습니다',
        en: 'You have been invited to a project',
        ja: 'プロジェクトへの招待が届きました',
      };
      
      const creator = await this.prisma.user.findUnique({
        where: { id: creatorId },
        select: { nickname: true },
      });
      
      const notificationMessage = JSON.stringify({
        type: 'project-invitation',
        projectId: projectId,
        projectTitle: project.title,
        applicationId: application.id, // 초대 수락/거절을 위한 applicationId
        creatorName: creator?.nickname || '프로젝트 생성자',
        message: messages[lang],
      });

      // 시스템 메시지로 저장 (senderId는 시스템 ID 사용)
      const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
      const chatMessage = await this.chatService.createMessage(
        systemChatRoom.id,
        SYSTEM_USER_ID,
        notificationMessage,
      );

      // 초대받는 사용자에게 번역된 메시지 전송
      const translatedMessage = await this.chatService.translateMessageForUser(
        chatMessage,
        invitedUserId,
      );

      // WebSocket을 통해 실시간 알림 전송
      const messageData: any = {
        ...translatedMessage,
        userId: SYSTEM_USER_ID, // 시스템 메시지임을 표시
        roomId: systemChatRoom.id,
        metadata: {
          type: 'project-invitation',
          projectId: projectId,
          projectTitle: project.title,
        },
      };

      await this.chatService.sendDirectNotification(invitedUserId, messageData);
      console.log(`✅ 초대 알림 전송 완료: ${creatorId} -> ${invitedUserId}`);
    } catch (error) {
      // 알림 전송 실패해도 초대는 성공으로 처리
      console.error('초대 알림 전송 실패:', error);
    }

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
        project: {
          select: {
            id: true,
            title: true,
            creatorId: true,
          },
        },
        user: {
          select: {
            id: true,
            nickname: true,
            role: true,
            country: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('참여 신청을 찾을 수 없습니다.');
    }

    // 프로젝트 생성자 또는 초대받은 사용자(신청자)만 수정 가능
    // 생성자는 수락/거절 가능, 초대받은 사용자는 자신의 초대를 수락/거절 가능
    const isCreator = application.project.creatorId === creatorId;
    const isInvitedUser = application.user.id === creatorId;
    
    if (!isCreator && !isInvitedUser) {
      throw new NotFoundException('참여 신청을 찾을 수 없습니다.');
    }
    
    // 초대받은 사용자는 수락만 가능 (거절은 가능하지만, 생성자가 거절하는 것과 동일)
    // 생성자는 수락/거절 모두 가능

    const updatedApplication = await this.prisma.projectApplication.update({
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

    // 수락된 경우 신청자에게 개인 채팅 알림 전송 (생성자가 수락한 경우에만)
    // 초대받은 사용자가 자신의 초대를 수락한 경우는 알림 불필요
    if (status === 'ACCEPTED' && isCreator) {
      try {
        const applicantId = application.user.id;
        const project = application.project;
        const creator = await this.prisma.user.findUnique({
          where: { id: creatorId },
          select: {
            id: true,
            nickname: true,
            country: true,
          },
        });

        if (!creator) return updatedApplication;

        // 신청자의 시스템 채팅방 생성 또는 조회
        const systemChatRoom = await this.chatService.getOrCreateSystemChatRoom(applicantId);

        // 알림 메시지 생성 (프로젝트 ID를 메타데이터로 포함)
        // 신청자의 국가에 맞는 언어로 메시지 생성
        const applicant = application.user;
        const applicantCountry = applicant.country || 'KR';
        const langMap: Record<string, string> = {
          KR: 'ko',
          US: 'en',
          JP: 'ja',
        };
        const lang = langMap[applicantCountry] || 'ko';
        
        const messages: Record<string, string> = {
          ko: '참여 신청이 수락되었습니다',
          en: 'Your application has been accepted',
          ja: '参加申請が承認されました',
        };
        
        const notificationMessage = JSON.stringify({
          type: 'application-accepted',
          projectId: project.id,
          projectTitle: project.title,
          message: messages[lang],
        });

        // 시스템 메시지로 저장 (senderId는 시스템 ID 사용)
        const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';
        const message = await this.chatService.createMessage(
          systemChatRoom.id,
          SYSTEM_USER_ID,
          notificationMessage,
        );

        // 신청자에게 번역된 메시지 전송
        const translatedMessage = await this.chatService.translateMessageForUser(
          message,
          applicantId,
        );

        // WebSocket을 통해 실시간 알림 전송
        const messageData: any = {
          ...translatedMessage,
          userId: SYSTEM_USER_ID, // 시스템 메시지임을 표시
          roomId: systemChatRoom.id,
          metadata: {
            type: 'application-accepted',
            projectId: project.id,
            projectTitle: project.title,
          },
        };

        await this.chatService.sendDirectNotification(applicantId, messageData);
        console.log(`✅ 시스템 알림 전송 완료: ${creator.nickname} -> ${application.user.nickname}`);
      } catch (error) {
        // 알림 전송 실패해도 수락은 성공으로 처리
        console.error('수락 알림 전송 실패:', error);
      }
    }

    return updatedApplication;
  }
}
