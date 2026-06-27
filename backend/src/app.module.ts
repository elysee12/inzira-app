import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AgeCategoryModule } from './age-category/age-category.module';
import { ContentModule } from './content/content.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { CHWModule } from './chw/chw.module';
import { MessageModule } from './message/message.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: {
        index: false,
        setHeaders: (res, path) => {
          // Force inline for ALL files we want to preview
          const filename = path.split(/[\\/]/).pop();
          
          if (path.toLowerCase().endsWith('.pdf')) {
            res.setHeader('Content-Type', 'application/pdf');
          } else if (path.toLowerCase().endsWith('.docx')) {
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
          } else if (path.toLowerCase().endsWith('.doc')) {
            res.setHeader('Content-Type', 'application/msword');
          } else if (path.toLowerCase().endsWith('.mp4')) {
            res.setHeader('Content-Type', 'video/mp4');
          } else if (path.toLowerCase().endsWith('.webm')) {
            res.setHeader('Content-Type', 'video/webm');
          } else if (path.toLowerCase().endsWith('.mp3')) {
            res.setHeader('Content-Type', 'audio/mpeg');
          } else if (path.toLowerCase().endsWith('.wav')) {
            res.setHeader('Content-Type', 'audio/wav');
          } else if (path.toLowerCase().endsWith('.aac')) {
            res.setHeader('Content-Type', 'audio/aac');
          } else if (path.toLowerCase().endsWith('.m4a')) {
            res.setHeader('Content-Type', 'audio/mp4');
          }
          
          // ALWAYS set Content-Disposition to INLINE, NO filename parameter (this forces browser won't trigger a download
          res.setHeader('Content-Disposition', 'inline');
          res.setHeader('X-Content-Type-Options', 'nosniff');
          
          // Enable byte-range requests for video/audio streaming
          res.setHeader('Accept-Ranges', 'bytes');
          
          // Enable CORS for media files (very permissive for development)
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', '*');
          res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
          res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
          res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
        },
      },
    }),
    PrismaModule,
    AgeCategoryModule,
    ContentModule,
    AuthModule,
    UserModule,
    CHWModule,
    MessageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
