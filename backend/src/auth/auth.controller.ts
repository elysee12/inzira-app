import { Controller, Post, Body, UnauthorizedException, Get, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() body: any) {
    if (!body.email && !body.phone && !body.identifier) {
      throw new BadRequestException('Injiza imeli cyangwa nimero ya telefoni');
    }
    
    const identifier = body.email || body.phone || body.identifier;
    const user = await this.authService.validateUser(identifier, body.password);
    
    if (!user) {
      throw new UnauthorizedException('Imeli cyangwa ijambo ry\'ibanga si ryo');
    }
    
    return this.authService.login(user);
  }

  @Post('register')
  async register(@Body() body: any) {
    if (!body.name || !body.email || !body.password || !body.phone) {
      throw new BadRequestException('Uzuza insobe zose zisabwa: izina, imeli, nimero ya telefoni, ijambo ry\'ibanga');
    }
    return this.authService.register(body);
  }

  @Post('find-by-email')
  async findByEmail(@Body('email') email: string) {
    const user = await this.authService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('Nta konti ifite iyi imeli');
    }
    return user;
  }

  @Post('send-otp')
  async sendOtp(@Body('email') email: string) {
    return this.authService.sendOtp(email);
  }

  @Post('verify-otp')
  async verifyOtp(@Body('email') email: string, @Body('otp') otp: string) {
    return this.authService.verifyOtp(email, otp);
  }

  @Post('reset-password')
  async resetPassword(@Body('email') email: string, @Body('otp') otp: string, @Body('newPassword') newPass: string) {
    return this.authService.resetPassword(email, otp, newPass);
  }
}
