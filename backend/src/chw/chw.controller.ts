import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CHWService } from './chw.service';

@Controller('chw')
export class CHWController {
  constructor(private chwService: CHWService) {}

  @Post()
  async createCHW(@Body() body: any) {
    return this.chwService.createCHW(body);
  }

  @Get()
  async getAllCHWs() {
    return this.chwService.getAllCHWs();
  }

  @Get(':id')
  async getCHWById(@Param('id', ParseIntPipe) id: number) {
    return this.chwService.getCHWById(id);
  }

  @Put(':id')
  async updateCHW(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.chwService.updateCHW(id, body);
  }

  @Delete(':id')
  async deleteCHW(@Param('id', ParseIntPipe) id: number) {
    await this.chwService.deleteCHW(id);
    return { message: 'CHW yakuwemo neza.' };
  }

  @Get(':id/parents')
  async getAssignedParents(@Param('id', ParseIntPipe) id: number) {
    return this.chwService.getAssignedParents(id);
  }
}
