import { Module } from '@nestjs/common';
import { AgeCategoryService } from './age-category.service';
import { AgeCategoryController } from './age-category.controller';

@Module({
  providers: [AgeCategoryService],
  controllers: [AgeCategoryController],
  exports: [AgeCategoryService],
})
export class AgeCategoryModule {}
