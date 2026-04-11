import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ContentService } from './content.service';
import { Content } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  async findAll(@Query('ageGroup') ageGroup?: string): Promise<Content[]> {
    if (ageGroup) {
      return this.contentService.findByAgeGroup(ageGroup);
    }
    return this.contentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Content | null> {
    return this.contentService.findOne(+id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async create(@Body() data: any, @UploadedFile() file?: Express.Multer.File): Promise<Content> {
    const { title, description, type, duration, ageGroup, postedById } = data;
    
    // Convert postedById to number and validate
    const parsedPostedById = parseInt(postedById);
    if (isNaN(parsedPostedById)) {
      throw new BadRequestException('Invalid postedById: must be a number');
    }

    const contentData = {
      title,
      description,
      type,
      duration,
      ageGroup,
      postedById: parsedPostedById,
      fileUrl: file ? `/uploads/${file.filename}` : data.fileUrl,
    };
    return this.contentService.create(contentData);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Content> {
    const updates: any = {};

    // Only add fields that are provided
    if (data.title) updates.title = data.title;
    if (data.description) updates.description = data.description;
    if (data.type) updates.type = data.type;
    if (data.duration) updates.duration = data.duration;
    if (data.ageGroup) updates.ageGroup = data.ageGroup;

    // Handle file upload if provided
    if (file) {
      updates.fileUrl = `/uploads/${file.filename}`;
      updates.oldFileUrl = data.oldFileUrl; // Pass old file URL for deletion
    }

    return this.contentService.update(+id, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.contentService.delete(+id);
    return { message: 'Content deleted successfully' };
  }
}
