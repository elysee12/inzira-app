import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { PasswordUtil } from '../auth/password.util';
import * as bcrypt from 'bcrypt';

type CHWPublic = {
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
  _count?: {
    assignedParents: number;
  };
};

@Injectable()
export class CHWService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async createCHW(data: {
    name: string;
    email: string;
    phone: string;
    province: string;
    district: string;
    sector: string;
    cell: string;
    village: string;
  }): Promise<{ chw: CHWPublic; temporaryPassword: string }> {
    // Check if email or phone already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: data.email }, { phone: data.phone }],
      },
    });

    if (existingUser) {
      throw new BadRequestException('Imeli cyangwa nimero ya telefoni irasanzwe.');
    }

    // Generate secure temporary password
    const temporaryPassword = PasswordUtil.generateSecurePassword();
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    // Create CHW user
    const chw = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: 'CHW',
        province: data.province,
        district: data.district,
        sector: data.sector,
        cell: data.cell,
        village: data.village,
      },
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
    }) as CHWPublic;

    // Send welcome email with credentials
    try {
      await this.emailService.sendCHWWelcomeEmail(
        data.email,
        data.name,
        data.email,
        data.phone,
        temporaryPassword,
        data.village,
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the registration if email fails
    }

    return { chw, temporaryPassword };
  }

  async getAllCHWs(): Promise<CHWPublic[]> {
    return this.prisma.user.findMany({
      where: { role: 'CHW' },
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
        _count: {
          select: { assignedParents: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  async getCHWById(id: number): Promise<CHWPublic> {
    const chw = await this.prisma.user.findUnique({
      where: { id, role: 'CHW' },
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
        _count: {
          select: { assignedParents: true },
        },
      },
    });

    if (!chw) {
      throw new NotFoundException('CHW ntibashoboka.');
    }

    return chw as CHWPublic;
  }

  async updateCHW(
    id: number,
    data: Partial<{
      name: string;
      email: string;
      phone: string;
      province: string;
      district: string;
      sector: string;
      cell: string;
      village: string;
    }>,
  ): Promise<CHWPublic> {
    const chw = await this.prisma.user.findUnique({
      where: { id, role: 'CHW' },
    });

    if (!chw) {
      throw new NotFoundException('CHW ntibashoboka.');
    }

    // Check if email or phone conflict with another user
    if (data.email || data.phone) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.email ? { email: data.email } : {},
                data.phone ? { phone: data.phone } : {},
              ],
            },
          ],
        },
      });

      if (conflict) {
        throw new BadRequestException('Imeli cyangwa nimero ya telefoni irasanzwe.');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data,
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

  async deleteCHW(id: number): Promise<void> {
    const chw = await this.prisma.user.findUnique({
      where: { id, role: 'CHW' },
    });

    if (!chw) {
      throw new NotFoundException('CHW ntibashoboka.');
    }

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async getAssignedParents(chwId: number): Promise<any[]> {
    const chw = await this.prisma.user.findUnique({
      where: { id: chwId, role: 'CHW' },
    });

    if (!chw) {
      throw new NotFoundException('CHW ntibashoboka.');
    }

    return this.prisma.user.findMany({
      where: {
        role: 'PARENT',
        village: chw.village,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        province: true,
        district: true,
        sector: true,
        cell: true,
        village: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
