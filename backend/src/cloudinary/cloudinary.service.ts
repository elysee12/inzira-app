import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService) {
    // Configure Cloudinary with credentials from environment variables
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });
  }

  /**
   * Check if Cloudinary is configured
   */
  isConfigured(): boolean {
    return !!(
      this.configService.get<string>('CLOUDINARY_CLOUD_NAME') &&
      this.configService.get<string>('CLOUDINARY_API_KEY') &&
      this.configService.get<string>('CLOUDINARY_API_SECRET')
    );
  }

  /**
   * Upload a file to Cloudinary
   * @param file - The uploaded file
   * @param folder - Optional folder name in Cloudinary
   * @returns Cloudinary upload result with secure_url
   */
  async uploadFile(file: Express.Multer.File, folder = 'imirire'): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: 'auto', // Automatically detect file type (image, video, raw for docs/audio)
          use_filename: true,
          unique_filename: true,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );

      // Write the buffer to the upload stream
      uploadStream.end(file.buffer);
    });
  }

  /**
   * Delete a file from Cloudinary
   * @param publicId - The public_id of the file in Cloudinary
   */
  async deleteFile(publicId: string): Promise<any> {
    return cloudinary.uploader.destroy(publicId);
  }

  /**
   * Extract public_id from Cloudinary URL
   * @param url - Full Cloudinary URL
   * @returns public_id string
   */
  extractPublicId(url: string): string | null {
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  }
}
