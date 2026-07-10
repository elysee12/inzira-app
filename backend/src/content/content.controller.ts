import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseInterceptors, UploadedFile, BadRequestException, NotFoundException, Res, UseGuards, Request } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import type { Response } from 'express';
import { ContentService } from './content.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Content } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Controller('content')
@UseGuards(JwtAuthGuard)
export class ContentController {
  constructor(
    private readonly contentService: ContentService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Get()
  async findAll(
    @Query('ageGroup') ageGroup?: string,
    @Request() req?: any,
  ): Promise<Content[]> {
    // Nurses, CHWs, and Parents only see content from their facility
    const facilityId =
      ['NURSE', 'CHW', 'PARENT'].includes(req?.user?.role) ? (req.user?.facilityId ?? undefined) : undefined;
    if (ageGroup) {
      return this.contentService.findByAgeGroup(ageGroup, facilityId);
    }
    return this.contentService.findAll(facilityId);
  }

  @Get('preview')
  async preview(@Query('fileUrl') fileUrl: string, @Res() res: Response) {
    if (!fileUrl) {
      throw new BadRequestException('fileUrl query parameter is required');
    }

    const normalizedPath = fileUrl.startsWith('/uploads') ? fileUrl.replace(/^\/+/, '') : fileUrl;
    const absolutePath = path.resolve(process.cwd(), normalizedPath);
    const baseDir = path.resolve(process.cwd());
    const relativePath = path.relative(baseDir, absolutePath);

    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      throw new BadRequestException('Invalid file path');
    }

    if (!fs.existsSync(absolutePath)) {
      throw new NotFoundException('File not found');
    }

    const extension = path.extname(absolutePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.aac': 'audio/aac',
      '.m4a': 'audio/mp4',
      '.txt': 'text/plain; charset=utf-8',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };

    res.setHeader('Content-Type', contentTypeMap[extension] ?? 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${path.basename(absolutePath)}"`);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');

    return res.sendFile(absolutePath);
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
    fileFilter: (req, file, cb) => {
      // Define allowed file types
      const allowedTypes = {
        text: ['.pdf', '.doc', '.docx', '.txt'],
        audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
        video: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'],
      };

      const fileExt = extname(file.originalname).toLowerCase();
      
      // Check if the type is in any of the allowed types
      const isAllowed = 
        [...allowedTypes.text, ...allowedTypes.audio, ...allowedTypes.video].includes(fileExt);

      if (isAllowed) {
        return cb(null, true);
      } else {
        return cb(new BadRequestException('Invalid file type'), false);
      }
    },
  }))
  async create(@Body() data: any, @UploadedFile() file?: Express.Multer.File): Promise<Content> {
    const { title, description, type, duration, ageGroup, postedById } = data;
    
    // Convert postedById to number and validate
    const parsedPostedById = parseInt(postedById);
    if (isNaN(parsedPostedById)) {
      throw new BadRequestException('Invalid postedById: must be a number');
    }

    let fileUrl = data.fileUrl;

    // If Cloudinary is configured and file is uploaded, use Cloudinary
    if (file && this.cloudinaryService.isConfigured()) {
      try {
        const result = await this.cloudinaryService.uploadFile(file, 'imirire/content');
        fileUrl = result.secure_url;
        console.log('[Cloudinary] File uploaded:', fileUrl);
      } catch (error) {
        console.error('[Cloudinary] Upload failed, falling back to local:', error);
        // Fallback to local storage if Cloudinary fails
        fileUrl = `/uploads/${file.filename}`;
      }
    } else if (file) {
      // No Cloudinary configured, use local storage
      fileUrl = `/uploads/${file.filename}`;
    }

    const contentData = {
      title,
      description,
      type,
      duration,
      ageGroup,
      postedById: parsedPostedById,
      fileUrl,
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
    fileFilter: (req, file, cb) => {
      // Define allowed file types
      const allowedTypes = {
        text: ['.pdf', '.doc', '.docx', '.txt'],
        audio: ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'],
        video: ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'],
      };

      const fileExt = extname(file.originalname).toLowerCase();
      
      // Check if the type is in any of the allowed types
      const isAllowed = 
        [...allowedTypes.text, ...allowedTypes.audio, ...allowedTypes.video].includes(fileExt);

      if (isAllowed) {
        return cb(null, true);
      } else {
        return cb(new BadRequestException('Invalid file type'), false);
      }
    },
  }))
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<Content> {
    const updates: any = {};

    // Only add fields that are provided
    if (data.title !== undefined) updates.title = data.title;
    if (data.description !== undefined) updates.description = data.description;
    if (data.type !== undefined) updates.type = data.type;
    if (data.duration !== undefined) updates.duration = data.duration;
    if (data.ageGroup !== undefined) updates.ageGroup = data.ageGroup;
    if (data.textContent !== undefined) updates.textContent = data.textContent;
    if (data.isNew !== undefined) updates.isNew = data.isNew === 'true' || data.isNew === true;

    // Handle file upload if provided
    if (file && this.cloudinaryService.isConfigured()) {
      try {
        const result = await this.cloudinaryService.uploadFile(file, 'imirire/content');
        updates.fileUrl = result.secure_url;
        console.log('[Cloudinary] File uploaded:', updates.fileUrl);
      } catch (error) {
        console.error('[Cloudinary] Upload failed, falling back to local:', error);
        updates.fileUrl = `/uploads/${file.filename}`;
      }
    } else if (file) {
      updates.fileUrl = `/uploads/${file.filename}`;
    } else if (data.fileUrl !== undefined) {
      updates.fileUrl = data.fileUrl;
    }

    return this.contentService.update(+id, updates);
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.contentService.delete(+id);
    return { message: 'Content deleted successfully' };
  }
}
