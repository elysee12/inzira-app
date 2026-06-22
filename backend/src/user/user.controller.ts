import { Controller, Get, Query, Patch, Delete, Param, Body, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';

type UserPublic = {
  id: number;
  email: string;
  phone: string;
  name: string;
  role: string;
  createdAt: Date;
};

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('by-role')
  async findByRole(@Query('role') role: string): Promise<UserPublic[]> {
    return this.userService.findByRole(role);
  }

  @Get('stats')
  async getStats(
    @Query('role') role?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ total: number; byRole: Record<string, number>; byDate?: number }> {
    const parsedStartDate = startDate ? new Date(startDate) : undefined;
    const parsedEndDate = endDate ? new Date(endDate) : undefined;

    return this.userService.getUserStats(role, parsedStartDate, parsedEndDate);
  }

  @Get()
  async findAll(): Promise<UserPublic[]> {
    return this.userService.findAll();
  }

  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number): Promise<UserPublic> {
    return this.userService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: any,
  ): Promise<UserPublic> {
    return this.userService.update(id, data);
  }

  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.userService.delete(id);
  }

  @Get(':id/chw')
  async getAssignedCHW(@Param('id', ParseIntPipe) id: number): Promise<any> {
    return this.userService.getAssignedCHW(id);
  }
}
