import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get<string>('SMTP_USER'),
        pass: this.configService.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(to: string, otp: string) {
    const mailOptions = {
      from: `"Inzira App" <${this.configService.get<string>('SMTP_USER')}>`,
      to,
      subject: 'Inzira App - Reset Password OTP',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; borderRadius: 10px;">
          <h2 style="color: #1A8A3A; text-align: center;">Inzira App</h2>
          <p>Muraho,</p>
          <p>Wagusabye guhindura ijambo ry'ibanga. Koresha iyi kode (OTP) ikurikira kugira ngo uomeze:</p>
          <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #1A8A3A; border-radius: 5px; margin: 20px 0;">
            ${otp}
          </div>
          <p>Iyi kode izarangira mu minota 10.</p>
          <p>Niba utarigeze usaba guhindura ijambo ry'ibanga, ushobora kwirengagiza iyi mēli.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">Inzira App &copy; 2026</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`OTP sent to ${to}`);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Gohereza imēli ntibyashobotse.');
    }
  }
}
