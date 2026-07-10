import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as https from 'https';

@Injectable()
export class EmailService {
  private brevoApiKey: string;
  private mailFrom: string;
  private mailFromName: string;

  constructor(private configService: ConfigService) {
    this.brevoApiKey = this.configService.get<string>('BREVO_API_KEY') || '';
    this.mailFrom = this.configService.get<string>('MAIL_FROM') || '';
    this.mailFromName = this.configService.get<string>('MAIL_FROM_NAME') || 'Imirire App';
  }

  private async sendBrevoEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    const data = JSON.stringify({
      sender: {
        name: this.mailFromName,
        email: this.mailFrom,
      },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': this.brevoApiKey,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    return new Promise((resolve, reject) => {
      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          const statusCode = res.statusCode || 0;
          if (statusCode >= 200 && statusCode < 300) {
            console.log(`Email sent successfully to ${to} via Brevo`);
            resolve();
          } else {
            console.error('Brevo API error:', body);
            reject(new Error(`Brevo API error: ${statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        console.error('Error sending email via Brevo:', error);
        reject(error);
      });

      req.write(data);
      req.end();
    });
  }

  async sendOtp(to: string, otp: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1A8A3A; text-align: center;">Imirire App</h2>
        <p>Muraho,</p>
        <p>Wagusabye guhindura ijambo ry'ibanga. Koresha iyi kode (OTP) ikurikira kugira ngo uomeze:</p>
        <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; color: #1A8A3A; border-radius: 5px; margin: 20px 0;">
          ${otp}
        </div>
        <p>Iyi kode izarangira mu minota 10.</p>
        <p>Niba utarigeze usaba guhindura ijambo ry'ibanga, ushobora kwirengagiza iyi mēli.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Imirire App &copy; 2026</p>
      </div>
    `;

    try {
      await this.sendBrevoEmail(to, 'Imirire App - Reset Password OTP', htmlContent);
    } catch (error) {
      console.error('Error sending OTP email:', error);
      throw new Error('Gohereza imēli ntibyashobotse.');
    }
  }

  async sendCHWWelcomeEmail(to: string, name: string, email: string, phone: string, temporaryPassword: string, village: string) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
        <h2 style="color: #1A8A3A; text-align: center;">Imirire App</h2>
        <h3 style="color: #2c3e50;">Murakaze, ${name}!</h3>
        <p>Turishimiye kukwakira nka Umukozi w'Ubuzima bw'Abaturage (Community Health Worker) kuri Imirire App.</p>
        
        <div style="background-color: #f0f9ff; padding: 15px; border-left: 4px solid #1A8A3A; margin: 20px 0;">
          <h4 style="margin-top: 0; color: #1A8A3A;">Amakuru y'Ukwinjira</h4>
          <p style="margin: 5px 0;"><strong>Imeli cyangwa Telefoni:</strong> ${email} ${phone ? `cyangwa ${phone}` : ''}</p>
          <p style="margin: 5px 0;"><strong>Ijambo ry'Ibanga ry'Igihe Gito:</strong> <span style="font-family: monospace; background: #fff; padding: 5px 10px; border-radius: 3px; font-size: 16px;">${temporaryPassword}</span></p>
          <p style="margin: 5px 0;"><strong>Umudugudu wawe:</strong> ${village}</p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
          <p style="margin: 0;"><strong>⚠️ Ibyumvire:</strong> Kubw'umutekano, nyamuneka hindura iri jambo ry'ibanga rimaze kwinjira bwa mbere.</p>
        </div>

        <h4 style="color: #2c3e50;">Inshingano zawe:</h4>
        <ul style="line-height: 1.8;">
          <li>Gukurikirana ababyeyi bose bo mu mudugudu wawe</li>
          <li>Gutanga ubufasha no kubafasha kuboneza amasomo</li>
          <li>Gusubiza ibibazo byabo binyuze muri sisitemu ya chat</li>
          <li>Gufasha abashakanye gukurikirana iterambere ry'abana babo</li>
        </ul>

        <div style="text-align: center; margin: 30px 0;">
          <p style="color: #64748b;">Injira ukoresheje imeli cyangwa nimero ya telefoni hamwe n'ijambo ry'ibanga.</p>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 12px; color: #64748b; text-align: center;">Imirire App &copy; 2026</p>
        <p style="font-size: 12px; color: #64748b; text-align: center;">Niba ufite ikibazo, watwandikira kuri: ${this.mailFrom}</p>
      </div>
    `;

    try {
      await this.sendBrevoEmail(to, 'Imirire App - Murakaze nka Umukozi w\'Ubuzima', htmlContent);
    } catch (error) {
      console.error('Error sending CHW welcome email:', error);
      throw new Error('Gohereza imēli y\'ikaze ntibyashobotse.');
    }
  }

  async sendNurseWelcomeEmail(
    to: string, 
    name: string, 
    email: string, 
    phone: string, 
    temporaryPassword: string, 
    facilityName: string
  ) {
    const loginUrl = 'https://imirere-app.onrender.com/login';
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h2 style="color: #2980B9; margin: 0;">Imirire Web Management Portal</h2>
          <p style="color: #64748b; margin-top: 5px;">Child Nutrition Platform</p>
        </div>
        
        <h3 style="color: #2c3e50;">Welcome, ${name}!</h3>
        <p>We are pleased to inform you that you have been registered as a <strong>Nurse/Nutritionist</strong> on the Imirire platform.</p>
        
        <div style="background-color: #e3f2fd; padding: 20px; border-left: 4px solid #2980B9; margin: 25px 0; border-radius: 5px;">
          <h4 style="margin-top: 0; color: #2980B9;">Your Login Credentials</h4>
          <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 8px 0;"><strong>Phone:</strong> ${phone}</p>
          <p style="margin: 8px 0;"><strong>Temporary Password:</strong></p>
          <div style="font-family: 'Courier New', monospace; background: #ffffff; padding: 12px 15px; border-radius: 5px; font-size: 18px; font-weight: bold; color: #2980B9; text-align: center; border: 2px dashed #2980B9;">
            ${temporaryPassword}
          </div>
          <p style="margin: 8px 0; margin-top: 15px;"><strong>Assigned Facility:</strong> ${facilityName}</p>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0;"><strong>⚠️ Important Security Notice:</strong></p>
          <p style="margin: 5px 0 0 0;">Please change this temporary password immediately after your first login for security purposes.</p>
        </div>

        <h4 style="color: #2c3e50; margin-top: 30px;">Your Responsibilities:</h4>
        <ul style="line-height: 1.8; color: #475569;">
          <li>Manage and create nutrition lessons and educational content</li>
          <li>Register and manage Community Health Workers (CHWs)</li>
          <li>Monitor parent registrations and engagement</li>
          <li>Oversee nutritional education delivery in your facility</li>
          <li>Respond to inquiries from CHWs and parents</li>
        </ul>

        <div style="text-align: center; margin: 35px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #2980B9 0%, #3498DB 100%); color: #ffffff; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(41, 128, 185, 0.3);">
            Login to Dashboard
          </a>
          <p style="margin-top: 15px; color: #64748b; font-size: 14px;">Or copy this link: ${loginUrl}</p>
        </div>

        <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px; margin: 25px 0;">
          <p style="margin: 0; font-size: 14px; color: #64748b;">
            <strong>Need Help?</strong> If you have any questions or need assistance, please contact us at:
          </p>
          <p style="margin: 5px 0 0 0; color: #2980B9; font-weight: 600;">${this.mailFrom}</p>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 30px 0;" />
        <div style="text-align: center;">
          <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;">Imirire App &copy; 2026 - Child Nutrition Platform</p>
          <p style="font-size: 12px; color: #94a3b8; margin: 5px 0;">Powered by Rwanda Health System</p>
        </div>
      </div>
    `;

    try {
      await this.sendBrevoEmail(to, 'Welcome to Imirire - Your Login Credentials', htmlContent);
    } catch (error) {
      console.error('Error sending Nurse welcome email:', error);
      throw new Error('Failed to send welcome email.');
    }
  }
}
