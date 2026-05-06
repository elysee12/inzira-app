import { Controller, Get, Post, Body, Param, Patch, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { AgeCategoryService } from './age-category.service';
import { AgeCategory } from '@prisma/client';

@Controller('age-categories')
export class AgeCategoryController {
  constructor(private readonly ageCategoryService: AgeCategoryService) {}

  @Get()
  async findAll(): Promise<AgeCategory[]> {
    return this.ageCategoryService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AgeCategory | null> {
    return this.ageCategoryService.findOne(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/categories',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `category-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async create(@Body() data: any, @UploadedFile() file?: Express.Multer.File): Promise<AgeCategory> {
    const { image, ...rest } = data;
    const categoryData = {
      ...rest,
      imageUrl: file ? `/uploads/categories/${file.filename}` : data.imageUrl,
    };
    return this.ageCategoryService.create(categoryData);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/categories',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `category-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async update(
    @Param('id') id: string,
    @Body() data: any,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<AgeCategory> {
    const { image, ...rest } = data;
    const updates: any = { ...rest };
    if (file) {
      updates.imageUrl = `/uploads/categories/${file.filename}`;
    }
    return this.ageCategoryService.update(id, updates);
  }
}
