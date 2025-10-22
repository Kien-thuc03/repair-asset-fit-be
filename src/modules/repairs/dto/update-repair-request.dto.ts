import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  IsArray,
  MaxLength,
} from 'class-validator';
import { RepairStatus } from 'src/common/shared/RepairStatus';
import { ErrorType } from 'src/common/shared/ErrorType';

export class UpdateRepairRequestDto {
  @ApiPropertyOptional({
    description: 'ID kỹ thuật viên được phân công',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID kỹ thuật viên phải là UUID hợp lệ' })
  assignedTechnicianId?: string;

  @ApiPropertyOptional({
    description: 'Loại lỗi (cập nhật sau khi xác định)',
    enum: ErrorType,
    enumName: 'ErrorType',
  })
  @IsOptional()
  @IsEnum(ErrorType, { 
    message: `Loại lỗi phải là một trong các giá trị: ${Object.values(ErrorType).join(', ')}` 
  })
  errorType?: ErrorType;

  @ApiPropertyOptional({
    description: 'Cập nhật mô tả chi tiết lỗi',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Mô tả lỗi phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Mô tả lỗi không được vượt quá 2000 ký tự' })
  description?: string;

  @ApiPropertyOptional({
    description: 'Cập nhật danh sách URL ảnh/video minh họa',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Media URLs phải là mảng' })
  @IsString({ each: true, message: 'Mỗi URL phải là chuỗi' })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Trạng thái yêu cầu sửa chữa',
    enum: RepairStatus,
    enumName: 'RepairStatus',
  })
  @IsOptional()
  @IsEnum(RepairStatus, { 
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(RepairStatus).join(', ')}` 
  })
  status?: RepairStatus;

  @ApiPropertyOptional({
    description: 'Ghi chú kết quả xử lý/sửa chữa',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú phải là chuỗi ký tự' })
  @MaxLength(2000, { message: 'Ghi chú không được vượt quá 2000 ký tự' })
  resolutionNotes?: string;
}