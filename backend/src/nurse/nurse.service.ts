import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../auth/email.service';
import { PasswordUtil } from '../auth/password.util';
import * as bcrypt from 'bcrypt';

@Injectable()
export class NurseService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

  async create(data: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    facilityId: number;
    province?: string;
    district?: string;
    sector?: string;
  }) {
    // Check if email or phone already exists
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { phone: data.phone },
        ],
      },
    });

    if (existing) {
      throw new ConflictException('Email or phone already registered');
    }

    // Verify facility exists
    const facility = await this.prisma.facility.findUnique({
      where: { id: data.facilityId },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    // Generate temporary password if not provided
    const temporaryPassword = data.password || PasswordUtil.generateNursePassword(data.name);

    // Hash password
    const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

    const nurse = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        password: hashedPassword,
        role: 'NURSE',
        facilityId: data.facilityId,
        province: data.province,
        district: data.district,
        sector: data.sector,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        facilityId: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        province: true,
        district: true,
        sector: true,
        createdAt: true,
      },
    });

    // Send welcome email with credentials
    try {
      await this.emailService.sendNurseWelcomeEmail(
        data.email,
        data.name,
        data.email,
        data.phone,
        temporaryPassword,
        facility.name
      );
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      // Don't fail the registration if email fails
    }

    return nurse;
  }

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: 'NURSE' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        facilityId: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        province: true,
        district: true,
        sector: true,
        createdAt: true,
        _count: {
          select: {
            contents: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const nurse = await this.prisma.user.findFirst({
      where: { id, role: 'NURSE' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        facilityId: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            province: true,
            district: true,
            sector: true,
          },
        },
        province: true,
        district: true,
        sector: true,
        createdAt: true,
        contents: {
          select: {
            id: true,
            title: true,
            type: true,
            postedAt: true,
          },
          orderBy: {
            postedAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!nurse) {
      throw new NotFoundException('Nurse not found');
    }

    return nurse;
  }

  async update(id: number, data: {
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
    facilityId?: number;
    province?: string;
    district?: string;
    sector?: string;
  }) {
    await this.findOne(id); // Check if exists

    // If email or phone is being updated, check for conflicts
    if (data.email || data.phone) {
      const existing = await this.prisma.user.findFirst({
        where: {
          AND: [
            { id: { not: id } },
            {
              OR: [
                data.email ? { email: data.email } : {},
                data.phone ? { phone: data.phone } : {},
              ].filter(obj => Object.keys(obj).length > 0),
            },
          ],
        },
      });

      if (existing) {
        throw new ConflictException('Email or phone already in use');
      }
    }

    // If facilityId is being updated, verify it exists
    if (data.facilityId) {
      const facility = await this.prisma.facility.findUnique({
        where: { id: data.facilityId },
      });

      if (!facility) {
        throw new NotFoundException('Facility not found');
      }
    }

    // Hash password if provided
    const updateData: any = { ...data };
    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        facilityId: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
          },
        },
        province: true,
        district: true,
        sector: true,
        createdAt: true,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id); // Check if exists

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async getStats() {
    const total = await this.prisma.user.count({ where: { role: 'NURSE' } });

    const byFacility = await this.prisma.user.groupBy({
      by: ['facilityId'],
      where: { role: 'NURSE' },
      _count: true,
    });

    const facilities = await this.prisma.facility.findMany({
      where: {
        id: { in: byFacility.map(b => b.facilityId).filter((id): id is number => id !== null) },
      },
      select: { id: true, name: true },
    });

    return {
      total,
      byFacility: byFacility.map(item => ({
        facilityId: item.facilityId,
        facilityName: facilities.find(f => f.id === item.facilityId)?.name || 'Unassigned',
        count: item._count,
      })),
    };
  }
}
