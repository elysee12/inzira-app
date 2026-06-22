import { Module } from '@nestjs/common';
import { CHWController } from './chw.controller';
import { CHWService } from './chw.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailService } from '../auth/email.service';

@Module({
  imports: [PrismaModule],
  controllers: [CHWController],
  providers: [CHWService, EmailService],
  exports: [CHWService],
})
export class CHWModule {}
