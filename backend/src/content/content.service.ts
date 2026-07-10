import { Injectable, BadRequestException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Content } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

@Injectable()
export class ContentService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    console.log('ContentService initialized. Checking for missing textContent...');
    await this.reExtractAllMissingText();
  }

  private async reExtractAllMissingText() {
    try {
      const contents = await this.prisma.content.findMany({
        where: {
          textContent: null,
          fileUrl: {
            not: null,
          },
        },
      });

      console.log(`Found ${contents.length} items with missing textContent.`);

      for (const item of contents) {
        if (!item.fileUrl) continue;
        
        let extractedText: string | null = null;
        if (item.fileUrl.toLowerCase().endsWith('.docx')) {
          extractedText = await this.extractTextFromDocx(item.fileUrl);
        } else if (item.fileUrl.toLowerCase().endsWith('.pdf')) {
          extractedText = await this.extractTextFromPdf(item.fileUrl);
        }

        if (extractedText) {
          await this.prisma.content.update({
            where: { id: item.id },
            data: { textContent: extractedText },
          });
          console.log(`Successfully extracted text for item: ${item.title}`);
        }
      }
    } catch (error) {
      console.error('Error in re-extracting missing text:', error);
    }
  }

  private async extractTextFromDocx(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) return null;

      const result = await mammoth.extractRawText({ path: fullPath });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from docx:', error);
      return null;
    }
  }

  private async extractTextFromPdf(filePath: string): Promise<string | null> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (!fs.existsSync(fullPath)) return null;

      const dataBuffer = fs.readFileSync(fullPath);
      const parser = new PDFParse({ data: dataBuffer });
      const result = await parser.getText();
      await parser.destroy();
      return result.text;
    } catch (error) {
      console.error('Error extracting text from pdf:', error);
      return null;
    }
  }

  async findAll(facilityId?: number): Promise<Content[]> {
    if (facilityId) {
      // Find all users (nurses/CHWs) in this facility, then get their content
      const facilityUsers = await this.prisma.user.findMany({
        where: { facilityId },
        select: { id: true },
      });
      const userIds = facilityUsers.map((u) => u.id);
      return this.prisma.content.findMany({
        where: { postedById: { in: userIds } },
        include: { ageCategory: true, postedBy: true },
        orderBy: { postedAt: 'desc' },
      });
    }
    return this.prisma.content.findMany({
      include: { ageCategory: true, postedBy: true },
      orderBy: { postedAt: 'desc' },
    });
  }

  async findByAgeGroup(ageGroup: string, facilityId?: number): Promise<Content[]> {
    const where: any = { ageGroup };
    if (facilityId) {
      const facilityUsers = await this.prisma.user.findMany({
        where: { facilityId },
        select: { id: true },
      });
      where.postedById = { in: facilityUsers.map((u) => u.id) };
    }
    return this.prisma.content.findMany({
      where,
      include: { ageCategory: true },
      orderBy: { postedAt: 'desc' },
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

    const contentData = {
      ...data,
      textContent:
        data.fileUrl && data.fileUrl.toLowerCase().endsWith('.docx')
          ? await this.extractTextFromDocx(data.fileUrl)
          : data.fileUrl && data.fileUrl.toLowerCase().endsWith('.pdf')
          ? await this.extractTextFromPdf(data.fileUrl)
          : null,
    };

    return this.prisma.content.create({
      data: contentData,
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

    // Extract text if fileUrl is being updated to a .docx or .pdf file
    if (updates.fileUrl && updates.fileUrl.toLowerCase().endsWith('.docx')) {
      updates.textContent = await this.extractTextFromDocx(updates.fileUrl);
    } else if (updates.fileUrl && updates.fileUrl.toLowerCase().endsWith('.pdf')) {
      updates.textContent = await this.extractTextFromPdf(updates.fileUrl);
    } else if (updates.fileUrl) {
      // If it's a new file but not docx/pdf, clear the textContent
      updates.textContent = null;
    } else if (updates.textContent !== undefined) {
      // If textContent is being updated directly (not via file)
      // Allow empty string to be saved as null
      if (updates.textContent === '') {
        updates.textContent = null;
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
