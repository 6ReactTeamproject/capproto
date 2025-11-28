// 채팅 서비스 - 채팅방 및 메시지 관리, 더미 번역 기능
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  // 프로젝트 채팅방 조회 또는 생성
  async getOrCreateChatRoom(projectId: string) {
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
