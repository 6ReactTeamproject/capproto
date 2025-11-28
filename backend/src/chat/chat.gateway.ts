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
    @MessageBody() data: { projectId: string },
  ) {
    // 프로젝트 ID로 채팅방 조회/생성
    const chatRoom = await this.chatService.getOrCreateChatRoom(data.projectId);
    client.join(`room-${chatRoom.id}`);
    console.log(`클라이언트 ${client.id}가 방 ${chatRoom.id}에 입장했습니다.`);

    // 기존 메시지 목록 전송
    client.emit('messages', chatRoom.messages);
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
    // 프로젝트 ID로 채팅방 조회/생성
    const chatRoom = await this.chatService.getOrCreateChatRoom(data.projectId);

    // 메시지 저장
    const message = await this.chatService.createMessage(
      chatRoom.id,
      data.senderId,
      data.content,
      data.sourceLang,
      data.targetLang,
    );

    // 같은 방의 모든 클라이언트에 브로드캐스트
    this.server.to(`room-${chatRoom.id}`).emit('new-message', message);
  }
}
