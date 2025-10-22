import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class AssignTechnicianDto {
  @ApiProperty({
    description: 'ID của kỹ thuật viên được phân công',
    format: 'uuid',
    example: '5c345ca6-02aa-41ef-924d-1fb427ce6e1c',
  })
  @IsUUID(4, { message: 'ID kỹ thuật viên phải là UUID hợp lệ' })
  @IsNotEmpty({ message: 'ID kỹ thuật viên không được để trống' })
  technicianId: string;

  @ApiPropertyOptional({
    description: 'Ghi chú phân công (ví dụ: mức độ ưu tiên, yêu cầu đặc biệt)',
    maxLength: 500,
    example: 'Yêu cầu xử lý ưu tiên cao, cần kỹ thuật viên có kinh nghiệm về phần cứng',
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @MaxLength(500, { message: 'Ghi chú không được vượt quá 500 ký tự' })
  assignmentNotes?: string;
}