// 채팅 컨트롤러 - REST API 엔드포인트
import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/project/:projectId')
  @UseGuards(JwtAuthGuard)
  async getOrCreateChatRoom(
    @Param('projectId') projectId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getOrCreateChatRoom(projectId, user.id);
  }

  @Get('messages/:roomId')
  @UseGuards(JwtAuthGuard)
  async getMessages(
    @Param('roomId') roomId: string,
    @CurrentUser() user: any,
  ) {
    // roomId가 실제로는 projectId일 수 있으므로 프로젝트 참여자 확인
    const chatRoom = await this.chatService.getOrCreateChatRoom(roomId, user.id);
    return chatRoom.messages || [];
  }

  @Get('rooms/direct/:userId')
  @UseGuards(JwtAuthGuard)
  async getOrCreateDirectChatRoom(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getOrCreateDirectChatRoom(user.id, userId);
  }

  @Get('rooms/direct')
  @UseGuards(JwtAuthGuard)
  async getDirectChatRooms(@CurrentUser() user: any) {
    return this.chatService.getDirectChatRooms(user.id);
  }

  @Post('translate')
  async translate(
    @Body()
    body: {
      content: string;
      sourceLang: string;
      targetLang: string;
    },
  ) {
    return this.chatService.translate(
      body.content,
      body.sourceLang,
      body.targetLang,
    );
  }
}
