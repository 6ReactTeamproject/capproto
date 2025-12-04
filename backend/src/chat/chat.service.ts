// 채팅 서비스 - 채팅방 및 메시지 관리, 더미 번역 기능
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // 사용자가 프로젝트 참여자인지 확인
  async checkProjectMember(projectId: string, userId: string): Promise<boolean> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('프로젝트를 찾을 수 없습니다.');
    }

    // 프로젝트 생성자는 항상 참여자
    if (project.creatorId === userId) {
      return true;
    }

    // 수락된 참여 신청이 있는지 확인
    const acceptedApplication = await this.prisma.projectApplication.findFirst({
      where: {
        projectId,
        userId,
        status: 'ACCEPTED',
      },
    });

    return !!acceptedApplication;
  }

  // 프로젝트 채팅방 조회 또는 생성
  async getOrCreateChatRoom(projectId: string, userId?: string) {
    // userId가 제공된 경우 참여자 확인
    if (userId) {
      const isMember = await this.checkProjectMember(projectId, userId);
      if (!isMember) {
        throw new ForbiddenException('프로젝트 참여자만 채팅방에 접근할 수 있습니다.');
      }
    }
    let chatRoom = await this.prisma.chatRoom.findUnique({
      where: { projectId },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chatRoom) {
      chatRoom = await this.prisma.chatRoom.create({
        data: { projectId },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
        },
      });
    }

    return chatRoom;
  }

  // 개인 채팅방 조회 또는 생성
  async getOrCreateDirectChatRoom(userId1: string, userId2: string) {
    // 자기 자신과의 채팅은 불가
    if (userId1 === userId2) {
      throw new ForbiddenException('자기 자신과는 채팅할 수 없습니다.');
    }

    // 두 사용자 ID를 정렬하여 중복 방지
    const [sortedId1, sortedId2] = [userId1, userId2].sort();

    // 기존 채팅방 찾기
    let chatRoom = await this.prisma.chatRoom.findFirst({
      where: {
        userId1: sortedId1,
        userId2: sortedId2,
        projectId: null,
      },
      include: {
        messages: {
          include: {
            sender: {
              select: {
                id: true,
                nickname: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        user1: {
          select: {
            id: true,
            nickname: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    // 채팅방이 없으면 생성
    if (!chatRoom) {
      chatRoom = await this.prisma.chatRoom.create({
        data: {
          userId1: sortedId1,
          userId2: sortedId2,
        },
        include: {
          messages: {
            include: {
              sender: {
                select: {
                  id: true,
                  nickname: true,
                },
              },
            },
            orderBy: { createdAt: 'asc' },
          },
          user1: {
            select: {
              id: true,
              nickname: true,
            },
          },
          user2: {
            select: {
              id: true,
              nickname: true,
            },
          },
        },
      });
    }

    return chatRoom;
  }

  // 사용자의 모든 개인 채팅방 목록 조회
  async getDirectChatRooms(userId: string) {
    const chatRooms = await this.prisma.chatRoom.findMany({
      where: {
        projectId: null,
        OR: [
          { userId1: userId },
          { userId2: userId },
        ],
      },
      include: {
        user1: {
          select: {
            id: true,
            nickname: true,
          },
        },
        user2: {
          select: {
            id: true,
            nickname: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return chatRooms.map((room) => {
      const otherUser = room.userId1 === userId ? room.user2 : room.user1;
      return {
        id: room.id,
        otherUser,
        lastMessage: room.messages[0] || null,
        updatedAt: room.updatedAt,
      };
    });
  }

  // 메시지 저장
  async createMessage(
    roomId: string,
    senderId: string,
    content: string,
    sourceLang: string,
    targetLang: string,
  ) {
    // TODO: 실제 번역 API 연동 예정
    const translatedContent = this.translateDummy(content, targetLang);

    const message = await this.prisma.chatMessage.create({
      data: {
        roomId,
        senderId,
        content,
        sourceLang,
        targetLang,
        translatedContent,
      },
      include: {
        sender: {
          select: {
            id: true,
            nickname: true,
          },
        },
      },
    });

    return message;
  }

  // 더미 번역 함수 - 실제 번역 API로 교체 예정
  private translateDummy(content: string, targetLang: string): string {
    // TODO: 실제 번역 API 연동 예정
    // 예: Google Translate API, DeepL API 등
    return `[번역:${targetLang}] ${content}`;
  }

  // REST API용 번역 엔드포인트 (테스트용)
  async translate(content: string, sourceLang: string, targetLang: string) {
    // TODO: 실제 번역 API 연동 예정
    const translatedContent = this.translateDummy(content, targetLang);
    return { translatedContent };
  }
}
