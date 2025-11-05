import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import {
  CloudinaryUploadResult,
  UploadOptions,
} from './interfaces/cloudinary.interface';
import * as streamifier from 'streamifier';

@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

  constructor(private configService: ConfigService) {
    // Configure Cloudinary
    cloudinary.config({
      cloud_name: this.configService.get<string>('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get<string>('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get<string>('CLOUDINARY_API_SECRET'),
    });

    this.logger.log('Cloudinary configured successfully');
  }

  /**
   * Upload file lên Cloudinary
   */
  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<CloudinaryUploadResult> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      const fileSizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      throw new BadRequestException(
        `File "${file.originalname}" có kích thước ${fileSizeInMB}MB vượt quá giới hạn 5MB cho phép`,
      );
    }

    try {
      return await new Promise<CloudinaryUploadResult>((resolve, reject) => {
        const uploadOptions = {
          folder: options.folder || 'repair-asset',
          resource_type: options.resource_type || 'auto',
          ...options,
        };

        const uploadStream = cloudinary.uploader.upload_stream(
          uploadOptions as any,
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload error:', error);
              reject(error);
            } else {
              this.logger.log(`File uploaded successfully: ${result.secure_url}`);
              resolve(result as unknown as CloudinaryUploadResult);
            }
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });
    } catch (error) {
      this.logger.error('Upload error:', error);
      const message = error instanceof Error ? error.message : 'Failed to upload file to Cloudinary';
      throw new BadRequestException(message);
    }
  }

  /**
   * Upload nhiều files lên Cloudinary
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    options: UploadOptions = {},
  ): Promise<CloudinaryUploadResult[]> {
    try {
      const uploadPromises = files.map((file) =>
        this.uploadFile(file, options),
      );
      return await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Multiple upload error:', error);
      throw new BadRequestException('Failed to upload files to Cloudinary');
    }
  }

  /**
   * Xóa file từ Cloudinary
   */
  async deleteFile(publicId: string): Promise<{ result: string }> {
    try {
      const result = await cloudinary.uploader.destroy(publicId);
      this.logger.log(`File deleted successfully: ${publicId}`);
      return result;
    } catch (error) {
      this.logger.error('Delete error:', error);
      throw new BadRequestException('Failed to delete file from Cloudinary');
    }
  }

  /**
   * Lấy public ID từ Cloudinary URL
   */
  getPublicIdFromUrl(url: string): string {
    try {
      const parts = url.split('/');
      const filename = parts[parts.length - 1];
      const publicId = filename.split('.')[0];

      // Nếu có folder, cần thêm folder vào public ID
      const folderIndex = parts.indexOf('upload') + 1;
      if (folderIndex < parts.length - 1) {
        const folders = parts.slice(folderIndex, -1).join('/');
        return `${folders}/${publicId}`;
      }

      return publicId;
    } catch (error) {
      this.logger.error('Error getting public ID from URL:', error);
      throw new BadRequestException('Failed to extract public ID from URL');
    }
  }

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get max file size
   */
  getMaxFileSize(): number {
    return this.MAX_FILE_SIZE;
  }
}
