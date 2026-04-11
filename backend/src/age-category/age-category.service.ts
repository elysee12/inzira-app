import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgeCategory } from '@prisma/client';

@Injectable()
export class AgeCategoryService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<AgeCategory[]> {
    return this.prisma.ageCategory.findMany();
  }

  async findOne(id: string): Promise<AgeCategory | null> {
    return this.prisma.ageCategory.findUnique({
      where: { id },
    });
  }

  async create(data: any): Promise<AgeCategory> {
    return this.prisma.ageCategory.create({
      data,
    });
  }
}
