import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { MessageService } from './message.service';

@Controller('messages')
export class MessageController {
  constructor(private messageService: MessageService) {}

  @Post()
  async sendMessage(@Body() body: { senderId: number; receiverId: number; content: string }) {
    return this.messageService.sendMessage(body.senderId, body.receiverId, body.content);
  }

  @Get('conversation')
  async getConversation(
    @Query('userId', ParseIntPipe) userId: number,
    @Query('otherUserId', ParseIntPipe) otherUserId: number,
  ) {
    return this.messageService.getConversation(userId, otherUserId);
  }

  @Get('conversations/:userId')
  async getConversations(@Param('userId', ParseIntPipe) userId: number) {
    return this.messageService.getConversations(userId);
  }

  @Get('unread/:userId')
  async getUnreadCount(@Param('userId', ParseIntPipe) userId: number) {
    return { unreadCount: await this.messageService.getUnreadCount(userId) };
  }

  @Post(':id/read')
  async markAsRead(@Param('id', ParseIntPipe) id: number, @Body('userId') userId: number) {
    return this.messageService.markAsRead(id, userId);
  }

  @Get('chw-for-parent/:parentId')
  async getCHWForParent(@Param('parentId', ParseIntPipe) parentId: number) {
    return this.messageService.getCHWForParent(parentId);
  }
}
