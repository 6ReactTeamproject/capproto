// 채팅 컨트롤러 - REST API 엔드포인트
import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('rooms/project/:projectId')
  async getOrCreateChatRoom(@Param('projectId') projectId: string) {
    return this.chatService.getOrCreateChatRoom(projectId);
  }

  @Get('messages/:roomId')
  async getMessages(@Param('roomId') roomId: string) {
    const chatRoom = await this.chatService.getOrCreateChatRoom(roomId);
    return chatRoom.messages;
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
