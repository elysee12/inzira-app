import { Controller, Get, Query } from '@nestjs/common';
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
}
