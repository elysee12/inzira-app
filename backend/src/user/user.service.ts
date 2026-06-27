import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

type UserPublic = {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: string;
  province?: string;
  district?: string;
  sector?: string;
  cell?: string;
  village?: string;
  createdAt: Date;
};

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findByRole(role: string): Promise<UserPublic[]> {
    return this.prisma.user.findMany({
      where: { role: role.toUpperCase() as any },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        province: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
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
        province: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async findById(id: number): Promise<UserPublic> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        province: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`Umukoresha ufite ID ${id} ntabwo abonetse.`);
    }

    return user as any;
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
    const updateData = { ...data };
    
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        phone: true,
        name: true,
        role: true,
        province: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        createdAt: true,
      },
    }) as any;
  }

  async delete(id: number): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getAssignedCHW(parentId: number): Promise<any> {
    // Get parent's village location
    const parent = await this.prisma.user.findUnique({
      where: { id: parentId },
      select: { village: true },
    });

    if (!parent || !parent.village) {
      return null;
    }

    // Find CHW in the same village
    const chw = await this.prisma.user.findFirst({
      where: {
        role: 'CHW',
        village: parent.village,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        village: true,
      },
    });

    return chw;
  }
}
