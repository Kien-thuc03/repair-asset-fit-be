import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  BadRequestException,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  FileInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { UploadService } from './upload.service';
import {
  UploadResponseDto,
  DeleteResponseDto,
} from './dto/upload-response.dto';

@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload file lên Cloudinary',
    description: 'Upload một file lên Cloudinary. Giới hạn kích thước: 5MB',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'File cần upload (max 5MB)',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ trên Cloudinary',
          example: 'repair-asset/repairs',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload thành công',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'File không hợp lệ hoặc quá lớn',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('folder') folder?: string,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const result = await this.uploadService.uploadFile(file, {
        folder: folder || 'repair-asset',
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  @Post('multiple')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiOperation({
    summary: 'Upload nhiều files lên Cloudinary',
    description: 'Upload tối đa 10 files cùng lúc. Mỗi file tối đa 5MB',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Danh sách files cần upload (max 10 files, mỗi file max 5MB)',
        },
        folder: {
          type: 'string',
          description: 'Thư mục lưu trữ trên Cloudinary',
          example: 'repair-asset/repairs',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Upload thành công',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        urls: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'https://res.cloudinary.com/demo/image/upload/v1234/repair-asset/file1.jpg',
            'https://res.cloudinary.com/demo/image/upload/v1234/repair-asset/file2.jpg',
          ],
        },
        publicIds: {
          type: 'array',
          items: { type: 'string' },
          example: ['repair-asset/file1', 'repair-asset/file2'],
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Files không hợp lệ hoặc quá lớn',
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('folder') folder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    if (files.length > 10) {
      throw new BadRequestException('Maximum 10 files allowed');
    }

    try {
      const results = await this.uploadService.uploadMultipleFiles(files, {
        folder: folder || 'repair-asset',
      });

      return {
        success: true,
        urls: results.map((r) => r.secure_url),
        publicIds: results.map((r) => r.public_id),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa file từ Cloudinary',
    description: 'Xóa file từ Cloudinary bằng public ID',
  })
  @ApiQuery({
    name: 'publicId',
    description: 'Public ID của file cần xóa',
    example: 'repair-asset/sample',
    required: true,
  })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    type: DeleteResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Public ID không hợp lệ',
  })
  async deleteFile(@Query('publicId') publicId: string): Promise<DeleteResponseDto> {
    if (!publicId) {
      throw new BadRequestException('Public ID is required');
    }

    try {
      const result = await this.uploadService.deleteFile(publicId);

      return {
        success: true,
        result: result.result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Delete failed',
      };
    }
  }
}
