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
  ) {}

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
      } else {
        throw new Error('projectId, userId, 또는 roomId가 필요합니다.');
      }

    client.join(`room-${chatRoom.id}`);
    console.log(`클라이언트 ${client.id}가 방 ${chatRoom.id}에 입장했습니다.`);

    // 기존 메시지 목록 전송
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
      sourceLang: string;
      targetLang: string;
    },
  ) {
    try {
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

    // 메시지 저장
    const message = await this.chatService.createMessage(
      chatRoom.id,
      data.senderId,
      data.content,
      data.sourceLang,
      data.targetLang,
    );

    // 같은 방의 모든 클라이언트에 브로드캐스트
    const messageData: any = { ...message };
    if (data.projectId) {
      messageData.projectId = data.projectId;
    } else if (data.userId) {
      messageData.userId = data.userId;
    }
    
    // 채팅방에 입장한 클라이언트들에게 브로드캐스트
    this.server.to(`room-${chatRoom.id}`).emit('new-message', messageData);
    
    // 개인 채팅의 경우, 상대방이 채팅방에 입장하지 않았더라도 직접 메시지 전송
    if (data.userId && chatRoom.userId1 && chatRoom.userId2) {
      const recipientId = chatRoom.userId1 === data.senderId ? chatRoom.userId2 : chatRoom.userId1;
      const recipientSockets = this.userSocketMap.get(recipientId);
      if (recipientSockets) {
        // 상대방에게 전송할 때는 senderId를 userId로 설정 (상대방 입장에서 보낸 사람의 ID)
        const recipientMessageData = { ...messageData };
        recipientMessageData.userId = data.senderId; // 상대방 입장에서 보낸 사람의 ID
        recipientSockets.forEach((socketId) => {
          this.server.to(socketId).emit('new-message', recipientMessageData);
        });
      }
    }
    } catch (error: any) {
      client.emit('error', { message: error.message || '메시지 전송 권한이 없습니다.' });
    }
  }
}
