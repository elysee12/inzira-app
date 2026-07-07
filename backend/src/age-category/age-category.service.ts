import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgeCategory } from '@prisma/client';

@Injectable()
export class AgeCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    const categories = await this.prisma.ageCategory.findMany({
      include: {
        _count: {
          select: { contents: true }
        }
      }
    });
    
    // Map to include contentCount
    return categories.map(category => ({
      ...category,
      contentCount: category._count.contents
    }));
  }

  async findOne(id: string): Promise<any | null> {
    const category = await this.prisma.ageCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: { contents: true }
        }
      }
    });
    
    if (!category) return null;
    
    return {
      ...category,
      contentCount: category._count.contents
    };
  }

  async create(data: any): Promise<AgeCategory> {
    return this.prisma.ageCategory.create({
      data,
    });
  }

  async update(id: string, data: any): Promise<AgeCategory> {
    const { _count, contentCount, ...validData } = data;
    return this.prisma.ageCategory.update({
      where: { id },
      data: validData,
    });
  }
}
