import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FacilityService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    name: string;
    type: string;
    province?: string;
    district?: string;
    sector?: string;
    phone?: string;
    email?: string;
    description?: string;
  }) {
    return this.prisma.facility.create({
      data,
    });
  }

  async findAll(includeInactive = false) {
    return this.prisma.facility.findMany({
      where: includeInactive ? {} : { isActive: true },
      include: {
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const facility = await this.prisma.facility.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });

    if (!facility) {
      throw new NotFoundException('Facility not found');
    }

    return facility;
  }

  async update(id: number, data: {
    name?: string;
    type?: string;
    province?: string;
    district?: string;
    sector?: string;
    phone?: string;
    email?: string;
    description?: string;
    isActive?: boolean;
  }) {
    await this.findOne(id); // Check if exists

    return this.prisma.facility.update({
      where: { id },
      data,
    });
  }

  async remove(id: number) {
    const facility = await this.findOne(id);

    // Check if facility has users
    const userCount = await this.prisma.user.count({
      where: { facilityId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete facility with ${userCount} associated users. Please reassign or remove users first.`
      );
    }

    return this.prisma.facility.delete({
      where: { id },
    });
  }

  async getStats() {
    const total = await this.prisma.facility.count();
    const active = await this.prisma.facility.count({ where: { isActive: true } });
    
    const byType = await this.prisma.facility.groupBy({
      by: ['type'],
      _count: true,
    });

    return {
      total,
      active,
      inactive: total - active,
      byType: byType.reduce((acc, item) => {
        acc[item.type] = item._count;
        return acc;
      }, {}),
    };
  }
}
