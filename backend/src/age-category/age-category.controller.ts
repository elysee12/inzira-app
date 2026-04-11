import { Controller, Get, Post, Body, Param } from '@nestjs/common';
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
  async create(@Body() data: any): Promise<AgeCategory> {
    return this.ageCategoryService.create(data);
  }
}
