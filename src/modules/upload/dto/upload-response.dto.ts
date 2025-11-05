import { ApiProperty } from '@nestjs/swagger';

export class UploadResponseDto {
  @ApiProperty({
    description: 'Upload thành công hay không',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'URL của file đã upload',
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/repair-asset/sample.jpg',
    required: false,
  })
  url?: string;

  @ApiProperty({
    description: 'Public ID của file trên Cloudinary',
    example: 'repair-asset/sample',
    required: false,
  })
  publicId?: string;

  @ApiProperty({
    description: 'Thông báo lỗi (nếu có)',
    example: 'File vượt quá kích thước cho phép',
    required: false,
  })
  error?: string;
}

export class DeleteResponseDto {
  @ApiProperty({
    description: 'Xóa thành công hay không',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Kết quả từ Cloudinary',
    example: 'ok',
    required: false,
  })
  result?: string;

  @ApiProperty({
    description: 'Thông báo lỗi (nếu có)',
    example: 'Không tìm thấy file',
    required: false,
  })
  error?: string;
}
