import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { FacilityService } from './facility.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('facilities')
export class FacilityController {
  constructor(private readonly facilityService: FacilityService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createFacilityDto: {
    name: string;
    type: string;
    province?: string;
    district?: string;
    sector?: string;
    phone?: string;
    email?: string;
    description?: string;
  }) {
    return this.facilityService.create(createFacilityDto);
  }

  // Public — needed during parent registration (no token yet)
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.facilityService.findAll(includeInactive === 'true');
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  getStats() {
    return this.facilityService.getStats();
  }

  // Public — needed by mobile app to resolve facility name after login
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.facilityService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateFacilityDto: {
      name?: string;
      type?: string;
      province?: string;
      district?: string;
      sector?: string;
      phone?: string;
      email?: string;
      description?: string;
      isActive?: boolean;
    }
  ) {
    return this.facilityService.update(id, updateFacilityDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.facilityService.remove(id);
  }
}
