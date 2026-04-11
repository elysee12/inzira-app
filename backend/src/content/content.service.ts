import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Content } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ContentService {
  constructor(private prisma: PrismaService) {}

  async findAll(): Promise<Content[]> {
    return this.prisma.content.findMany({
      include: { ageCategory: true, postedBy: true },
    });
  }

  async findByAgeGroup(ageGroup: string): Promise<Content[]> {
    return this.prisma.content.findMany({
      where: { ageGroup },
      include: { ageCategory: true },
    });
  }

  async findOne(id: number): Promise<Content | null> {
    return this.prisma.content.findUnique({
      where: { id },
      include: { ageCategory: true, postedBy: true },
    });
  }

  async create(data: any): Promise<Content> {
    // Validate required fields
    if (!data.title || !data.description || !data.type || !data.ageGroup || !data.postedById) {
      throw new BadRequestException(
        'Missing required fields: title, description, type, ageGroup, postedById',
      );
    }

    // Validate that ageGroup exists
    const ageCategory = await this.prisma.ageCategory.findUnique({
      where: { id: data.ageGroup },
    });

    if (!ageCategory) {
      throw new BadRequestException(`AgeCategory with id "${data.ageGroup}" does not exist`);
    }

    // Validate that user exists
    const user = await this.prisma.user.findUnique({
      where: { id: data.postedById },
    });

    if (!user) {
      throw new BadRequestException(`User with id ${data.postedById} does not exist`);
    }

    return this.prisma.content.create({
      data,
      include: { ageCategory: true, postedBy: true },
    });
  }

  async update(id: number, updates: any): Promise<Content> {
    // Validate that content exists
    const existingContent = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!existingContent) {
      throw new BadRequestException(`Content with id ${id} does not exist`);
    }

    // Validate ageGroup if being updated
    if (updates.ageGroup && updates.ageGroup !== existingContent.ageGroup) {
      const ageCategory = await this.prisma.ageCategory.findUnique({
        where: { id: updates.ageGroup },
      });

      if (!ageCategory) {
        throw new BadRequestException(`AgeCategory with id "${updates.ageGroup}" does not exist`);
      }
    }

    // Delete old file if new file is being uploaded
    if (updates.fileUrl && updates.fileUrl !== existingContent.fileUrl && existingContent.fileUrl) {
      try {
        const oldFilePath = path.join(process.cwd(), existingContent.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      } catch (error) {
        // Log error but don't fail the update
        console.error('Error deleting old file:', error);
      }
    }

    // Remove oldFileUrl from updates if present (it's only for internal tracking)
    delete updates.oldFileUrl;

    return this.prisma.content.update({
      where: { id },
      data: updates,
      include: { ageCategory: true, postedBy: true },
    });
  }

  async delete(id: number): Promise<void> {
    // Find content to get file URL for deletion
    const content = await this.prisma.content.findUnique({
      where: { id },
    });

    if (!content) {
      throw new BadRequestException(`Content with id ${id} does not exist`);
    }

    // Delete file if it exists
    if (content.fileUrl) {
      try {
        const filePath = path.join(process.cwd(), content.fileUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
        // Log error but don't fail the deletion
        console.error('Error deleting file:', error);
      }
    }

    // Delete content from database
    await this.prisma.content.delete({
      where: { id },
    });
  }
}
