import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CHWService } from './chw.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('chw')
@UseGuards(JwtAuthGuard)
export class CHWController {
  constructor(private chwService: CHWService) {}

  @Post()
  async createCHW(@Body() body: any, @Request() req: any) {
    // If the logged-in user is a NURSE, automatically assign their facility
    if (req.user?.role === 'NURSE' && req.user?.facilityId) {
      body.facilityId = req.user.facilityId;
    }
    return this.chwService.createCHW(body);
  }

  @Get()
  async getAllCHWs(@Request() req: any) {
    // Nurses, CHWs, and Parents only see CHWs in their own facility
    const facilityId =
      ['NURSE', 'CHW', 'PARENT'].includes(req.user?.role) ? req.user?.facilityId : undefined;
    return this.chwService.getAllCHWs(facilityId ?? undefined);
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
