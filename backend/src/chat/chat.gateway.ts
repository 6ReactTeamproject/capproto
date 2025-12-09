// WebSocket Gateway - 실시간 채팅 처리
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // 사용자 ID -> 소켓 ID 목록 맵
  private userSocketMap = new Map<string, Set<string>>();

  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    // ChatService에 gateway 참조 설정 (순환 참조 방지)
    this.chatService.setChatGateway(this);
  }

  private extractUserIdFromToken(token: string): string | null {
    try {
      const secret = this.configService.get<string>('JWT_SECRET') || 'secret';
      const decoded = jwt.verify(token, secret) as any;
      return decoded.sub || null;
    } catch (error) {
      return null;
    }
  }

  handleConnection(client: Socket) {
    console.log(`클라이언트 연결: ${client.id}`);
    
    // 인증 토큰에서 사용자 ID 추출
    const token = client.handshake.auth?.token;
    if (token) {
      const userId = this.extractUserIdFromToken(token);
      if (userId) {
        if (!this.userSocketMap.has(userId)) {
          this.userSocketMap.set(userId, new Set());
        }
        this.userSocketMap.get(userId)!.add(client.id);
        (client as any).userId = userId; // 소켓에 사용자 ID 저장
        console.log(`사용자 ${userId}가 소켓 ${client.id}로 연결되었습니다.`);
      }
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`클라이언트 연결 해제: ${client.id}`);
    
    // 사용자 ID로 소켓 제거
    const userId = (client as any).userId;
    if (userId) {
      const sockets = this.userSocketMap.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.userSocketMap.delete(userId);
        }
      }
    }
  }

  // 채팅방 입장 (프로젝트 또는 개인 채팅)
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId?: string; userId?: string; roomId?: string; currentUserId: string },
  ) {
    try {
      let chatRoom;
      
      if (data.projectId) {
        // 프로젝트 채팅방
        chatRoom = await this.chatService.getOrCreateChatRoom(data.projectId, data.currentUserId);
      } else if (data.userId) {
        // 개인 채팅방
        chatRoom = await this.chatService.getOrCreateDirectChatRoom(data.currentUserId, data.userId);
      } else if (data.roomId) {
        // roomId로 직접 조회
        chatRoom = await this.prisma.chatRoom.findUnique({
          where: { id: data.roomId },
          include: {
            messages: {
              include: {
                sender: {
                  select: {
                    id: true,
                    nickname: true,
                    country: true,
                  },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
          },
        });
        if (!chatRoom) {
          throw new Error('채팅방을 찾을 수 없습니다.');
        }
        // 현재 사용자의 언어로 메시지 번역
        if (chatRoom.messages && chatRoom.messages.length > 0) {
          const translatedMessages = await Promise.all(
            chatRoom.messages.map((msg) => this.chatService.translateMessageForUser(msg, data.currentUserId))
          );
          chatRoom = {
            ...chatRoom,
            messages: translatedMessages,
          };
        } else {
          chatRoom = {
            ...chatRoom,
            messages: chatRoom.messages || [],
          };
        }
      } else {
        throw new Error('projectId, userId, 또는 roomId가 필요합니다.');
      }

    client.join(`room-${chatRoom.id}`);
    console.log(`클라이언트 ${client.id}가 방 ${chatRoom.id}에 입장했습니다.`);

    // 기존 메시지 목록 전송 (이미 번역됨)
    client.emit('messages', chatRoom.messages);
    } catch (error: any) {
      client.emit('error', { message: error.message || '채팅방 접근 권한이 없습니다.' });
    }
  }

  // 메시지 전송 (프로젝트 또는 개인 채팅)
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      projectId?: string;
      userId?: string;
      roomId?: string;
      senderId: string;
      content: string;
    },
  ) {
    try {
      console.log('메시지 전송 요청:', { projectId: data.projectId, userId: data.userId, senderId: data.senderId, content: data.content });
      let chatRoom;
      
      if (data.projectId) {
        // 프로젝트 채팅방
        chatRoom = await this.chatService.getOrCreateChatRoom(data.projectId, data.senderId);
      } else if (data.userId) {
        // 개인 채팅방
        chatRoom = await this.chatService.getOrCreateDirectChatRoom(data.senderId, data.userId);
      } else if (data.roomId) {
        // roomId로 직접 조회
        chatRoom = await this.prisma.chatRoom.findUnique({
          where: { id: data.roomId },
        });
        if (!chatRoom) {
          throw new Error('채팅방을 찾을 수 없습니다.');
        }
      } else {
        throw new Error('projectId, userId, 또는 roomId가 필요합니다.');
      }

      // 메시지 저장 (보낸 사람의 국가 언어로 자동 결정)
    const message = await this.chatService.createMessage(
      chatRoom.id,
      data.senderId,
      data.content,
      );

      // 프로젝트 채팅방의 경우: 프로젝트 참여자들에게 각자의 언어로 번역하여 전송
      if (data.projectId) {
        // 프로젝트 참여자 목록 가져오기
        const project = await this.prisma.project.findUnique({
          where: { id: data.projectId },
          select: { creatorId: true },
        });
        
        const acceptedApplications = await this.prisma.projectApplication.findMany({
          where: {
            projectId: data.projectId,
            status: 'ACCEPTED',
          },
          select: { userId: true },
        });

        // 채팅방에 입장한 모든 클라이언트에게 브로드캐스트
        // 각 참여자에게 자신의 언어로 번역된 메시지 전송
        const participantIds = new Set<string>();
        if (project) {
          participantIds.add(project.creatorId);
        }
        acceptedApplications.forEach((app) => participantIds.add(app.userId));

        // 모든 참여자에게 메시지 전송 (보낸 사람 포함)
        for (const participantId of participantIds) {
          const translatedMessage = await this.chatService.translateMessageForUser(message, participantId);
          const messageData: any = {
            ...translatedMessage,
            projectId: data.projectId,
          };

          // 해당 참여자의 소켓들에게 직접 전송
          const participantSockets = this.userSocketMap.get(participantId);
          if (participantSockets) {
            participantSockets.forEach((socketId) => {
              this.server.to(socketId).emit('new-message', messageData);
            });
          }
        }

        // 채팅방에 입장한 모든 클라이언트에게도 브로드캐스트 (fallback)
        // 보낸 사람의 언어로 번역된 메시지 전송
        const senderTranslatedMessage = await this.chatService.translateMessageForUser(message, data.senderId);
        const broadcastMessage = {
          ...senderTranslatedMessage,
          projectId: data.projectId,
        };
        this.server.to(`room-${chatRoom.id}`).emit('new-message', broadcastMessage);
      } 
      // 개인 채팅방의 경우: 상대방에게 번역된 메시지 전송
      else if (data.userId && chatRoom.userId1 && chatRoom.userId2) {
        const recipientId = chatRoom.userId1 === data.senderId ? chatRoom.userId2 : chatRoom.userId1;
        
        // 상대방에게 번역된 메시지 전송
        const translatedMessage = await this.chatService.translateMessageForUser(message, recipientId);
        const recipientMessageData: any = {
          ...translatedMessage,
          userId: data.senderId, // 상대방 입장에서 보낸 사람의 ID
        };

        // 상대방의 소켓들에게 전송
        const recipientSockets = this.userSocketMap.get(recipientId);
        if (recipientSockets) {
          recipientSockets.forEach((socketId) => {
            this.server.to(socketId).emit('new-message', recipientMessageData);
          });
        }

        // 보낸 사람에게도 자신의 언어로 메시지 전송 (자신이 보낸 메시지이므로 원문)
        const senderTranslatedMessage = await this.chatService.translateMessageForUser(message, data.senderId);
        const senderMessageData: any = {
          ...senderTranslatedMessage,
          userId: recipientId,
        };
        const senderSockets = this.userSocketMap.get(data.senderId);
        if (senderSockets) {
          senderSockets.forEach((socketId) => {
            this.server.to(socketId).emit('new-message', senderMessageData);
          });
        }

        // 채팅방에 입장한 모든 클라이언트에게도 브로드캐스트 (fallback)
        // 보낸 사람의 언어로 번역된 메시지 전송
        const broadcastMessage = {
          ...senderTranslatedMessage,
          userId: recipientId,
        };
        console.log('개인 채팅방 브로드캐스트:', broadcastMessage);
        this.server.to(`room-${chatRoom.id}`).emit('new-message', broadcastMessage);
      }
    } catch (error: any) {
      client.emit('error', { message: error.message || '메시지 전송 권한이 없습니다.' });
    }
  }

  // 개인 채팅 알림 전송 (외부 서비스에서 호출)
  async sendDirectNotification(recipientId: string, messageData: any) {
    const recipientSockets = this.userSocketMap.get(recipientId);
    if (recipientSockets) {
      recipientSockets.forEach((socketId) => {
        this.server.to(socketId).emit('new-message', messageData);
      });
    }
    // 채팅방에 입장한 클라이언트에게도 브로드캐스트
    if (messageData.roomId) {
      this.server.to(`room-${messageData.roomId}`).emit('new-message', messageData);
    }
  }
}
