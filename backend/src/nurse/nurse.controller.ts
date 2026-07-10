import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { NurseService } from './nurse.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('nurses')
@UseGuards(JwtAuthGuard)
export class NurseController {
  constructor(private readonly nurseService: NurseService) {}

  @Post()
  create(@Body() createNurseDto: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    facilityId: number;
    province?: string;
    district?: string;
    sector?: string;
  }) {
    return this.nurseService.create(createNurseDto);
  }

  @Get()
  findAll() {
    return this.nurseService.findAll();
  }

  @Get('stats')
  getStats() {
    return this.nurseService.getStats();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.nurseService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateNurseDto: {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      facilityId?: number;
      province?: string;
      district?: string;
      sector?: string;
    }
  ) {
    return this.nurseService.update(id, updateNurseDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.nurseService.remove(id);
  }
}
