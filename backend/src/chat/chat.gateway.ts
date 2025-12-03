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

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private chatService: ChatService,
    private prisma: PrismaService,
  ) {}

  handleConnection(client: Socket) {
    console.log(`클라이언트 연결: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`클라이언트 연결 해제: ${client.id}`);
  }

  // 채팅방 입장
  @SubscribeMessage('join-room')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { projectId: string; userId: string },
  ) {
    try {
      // 프로젝트 참여자 확인
      const chatRoom = await this.chatService.getOrCreateChatRoom(data.projectId, data.userId);
      client.join(`room-${chatRoom.id}`);
      console.log(`클라이언트 ${client.id}가 방 ${chatRoom.id}에 입장했습니다.`);

      // 기존 메시지 목록 전송
      client.emit('messages', chatRoom.messages);
    } catch (error: any) {
      client.emit('error', { message: error.message || '채팅방 접근 권한이 없습니다.' });
    }
  }

  // 메시지 전송
  @SubscribeMessage('send-message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      projectId: string;
      senderId: string;
      content: string;
      sourceLang: string;
      targetLang: string;
    },
  ) {
    try {
      // 프로젝트 참여자 확인
      const chatRoom = await this.chatService.getOrCreateChatRoom(data.projectId, data.senderId);

      // 메시지 저장
      const message = await this.chatService.createMessage(
        chatRoom.id,
        data.senderId,
        data.content,
        data.sourceLang,
        data.targetLang,
      );

      // 같은 방의 모든 클라이언트에 브로드캐스트 (projectId 포함)
      this.server.to(`room-${chatRoom.id}`).emit('new-message', {
        ...message,
        projectId: data.projectId,
      });
    } catch (error: any) {
      client.emit('error', { message: error.message || '메시지 전송 권한이 없습니다.' });
    }
  }
}
