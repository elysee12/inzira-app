import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private emailService: EmailService,
    private prisma: PrismaService,
  ) {}

  async validateUser(identifier: string, pass: string): Promise<any> {
    const user = await this.userService.findByIdentifier(identifier);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(data: any) {
    const user = await this.userService.create(data);
    const { password, ...result } = user;
    return result;
  }

  async findByEmail(email: string) {
    const user = await this.userService.findByEmail(email);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async sendOtp(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('Nta konti iboneka ifite iyi imeli.');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 10); // 10 minutes expiry

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        otpCode: otp,
        otpExpires: expires,
      },
    });

    await this.emailService.sendOtp(email, otp);
    return { message: 'Kode OTP yoherejwe neza.' };
  }

  async verifyOtp(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || user.otpCode !== otp || !user.otpExpires || user.otpExpires < new Date()) {
      throw new BadRequestException('Kode OTP si yo cyangwa yarengeje igihe.');
    }

    return true;
  }

  async resetPassword(email: string, otp: string, newPass: string) {
    await this.verifyOtp(email, otp);

    const hashedPassword = await bcrypt.hash(newPass, 10);

    await this.prisma.user.update({
      where: { email },
      data: {
        password: hashedPassword,
        otpCode: null,
        otpExpires: null,
      },
    });

    return { message: "Ijambo ry'ibanga ryahinduwe neza." };
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('Nta konti iboneka.');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Ijambo ry\'ibanga cyanyu cyaha.');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedNewPassword,
      },
    });

    return { message: "Ijambo ry'ibanga ryahinduwe neza." };
  }
}
