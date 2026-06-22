import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MessageService {
  constructor(private prisma: PrismaService) {}

  async sendMessage(senderId: number, receiverId: number, content: string) {
    const sender = await this.prisma.user.findUnique({ where: { id: senderId } });
    const receiver = await this.prisma.user.findUnique({ where: { id: receiverId } });

    if (!sender || !receiver) {
      throw new NotFoundException('Umukoresha ntabashoboka.');
    }

    // Verify that sender and receiver have proper relationship
    // CHW can message parents in their village, parents can message their CHW
    if (sender.role === 'CHW' && receiver.role === 'PARENT') {
      if (sender.village !== receiver.village) {
        throw new ForbiddenException('Ntushobora kohereza ubutumwa uwo mukozi utari mu mudugudu wawe.');
      }
    } else if (sender.role === 'PARENT' && receiver.role === 'CHW') {
      if (sender.village !== receiver.village) {
        throw new ForbiddenException('Ntushobora kohereza ubutumwa CHW utari mu mudugudu wawe.');
      }
    } else {
      throw new ForbiddenException('Ntushobora kohereza ubutumwa uyu mukoresha.');
    }

    return this.prisma.message.create({
      data: {
        senderId,
        receiverId,
        content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
    });
  }

  async getConversation(userId: number, otherUserId: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const otherUser = await this.prisma.user.findUnique({ where: { id: otherUserId } });

    if (!user || !otherUser) {
      throw new NotFoundException('Umukoresha ntabashoboka.');
    }

    // Mark messages from other user as read
    await this.prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    return this.prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getConversations(userId: number) {
    const user = await this.prisma.user.findUnique({ 
      where: { id: userId },
      select: { role: true, village: true }
    });

    if (!user) {
      throw new NotFoundException('Umukoresha ntabashoboka.');
    }

    // Get all messages involving this user
    const messages = await this.prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group by conversation partner
    const conversationsMap = new Map();

    for (const message of messages) {
      const partnerId = message.senderId === userId ? message.receiverId : message.senderId;
      
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner: message.senderId === userId ? message.receiver : message.sender,
          lastMessage: message,
          unreadCount: 0,
        });
      }

      // Count unread messages from partner
      if (message.receiverId === userId && !message.isRead) {
        const conv = conversationsMap.get(partnerId);
        conv.unreadCount++;
      }
    }

    return Array.from(conversationsMap.values());
  }

  async getUnreadCount(userId: number): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false,
      },
    });
  }

  async markAsRead(messageId: number, userId: number) {
    const message = await this.prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundException('Ubutumwa ntibuboneka.');
    }

    if (message.receiverId !== userId) {
      throw new ForbiddenException('Ntushobora guhindura ubutumwa butari ubwawe.');
    }

    return this.prisma.message.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }

  async getCHWForParent(parentId: number) {
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId, role: 'PARENT' },
      select: { village: true },
    });

    if (!parent || !parent.village) {
      return null;
    }

    // Find CHW in the same village
    return this.prisma.user.findFirst({
      where: {
        role: 'CHW',
        village: parent.village,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
      },
    });
  }
}
