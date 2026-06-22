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
}
