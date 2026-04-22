import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type UserPublic = {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: string;
  createdAt: Date;
};

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findByRole(role: string): Promise<UserPublic[]> {
    const validRoles = ['ADMIN', 'PARENT'];
    if (!validRoles.includes(role.toUpperCase())) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }

    return this.prisma.user.findMany({
      where: { role: role.toUpperCase() as any },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async findAll(): Promise<UserPublic[]> {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async getUserStats(
    role?: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ total: number; byRole: Record<string, number>; byDate?: number }> {
    const whereClause: any = {};
    if (role) {
      whereClause.role = role.toUpperCase();
    }
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = startDate;
      if (endDate) whereClause.createdAt.lte = endDate;
    }

    const total = await this.prisma.user.count({ where: whereClause });

    const byRole: Record<string, number> = {
      ADMIN: await this.prisma.user.count({ where: { role: 'ADMIN' } }),
      PARENT: await this.prisma.user.count({ where: { role: 'PARENT' } }),
    };

    let byDate = 0;
    if (startDate || endDate) {
      byDate = total;
    }

    return { total, byRole, byDate };
  }

  async update(id: number, data: any): Promise<UserPublic> {
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        createdAt: true,
      },
    }) as any;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }
}
