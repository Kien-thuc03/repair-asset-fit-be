import { Expose, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RepairStatus } from 'src/common/shared/RepairStatus';
import { ErrorType } from 'src/common/shared/ErrorType';

class AssetInfoDto {
  @Expose()
  @ApiProperty({ description: 'ID của tài sản' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Mã kế toán tài sản' })
  ktCode: string;

  @Expose()
  @ApiProperty({ description: 'Tên tài sản' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Loại tài sản' })
  type: string;

  @Expose()
  @ApiProperty({ description: 'Trạng thái tài sản' })
  status: string;
}

class RoomInfoDto {
  @Expose()
  @ApiProperty({ description: 'ID phòng' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Tên phòng' })
  name: string;

  @Expose()
  @ApiProperty({ description: 'Tòa nhà' })
  building: string;

  @Expose()
  @ApiProperty({ description: 'Tầng' })
  floor: string;

  @Expose()
  @ApiProperty({ description: 'Số phòng' })
  roomNumber: string;
}

class UserInfoDto {
  @Expose()
  @ApiProperty({ description: 'ID người dùng' })
  id: string;

  @Expose()
  @ApiProperty({ description: 'Tên đầy đủ' })
  fullName: string;

  @Expose()
  @ApiProperty({ description: 'Email' })
  email: string;

  @Expose()
  @ApiProperty({ description: 'Tên đăng nhập' })
  username: string;
}

export class RepairRequestResponseDto {
  @Expose()
  @ApiProperty({ description: 'ID yêu cầu sửa chữa' })
  id: string;

  @Expose()
  @ApiProperty({ 
    description: 'Mã yêu cầu tự tăng',
    example: 'YCSC-2025-0001'
  })
  requestCode: string;

  @Expose()
  @ApiProperty({ description: 'ID tài sản (máy tính)' })
  computerAssetId: string;

  @Expose()
  @Type(() => AssetInfoDto)
  @ApiPropertyOptional({ description: 'Thông tin tài sản', type: AssetInfoDto })
  computerAsset?: AssetInfoDto;

  @Expose()
  @Type(() => RoomInfoDto)
  @ApiPropertyOptional({ description: 'Thông tin phòng', type: RoomInfoDto })
  room?: RoomInfoDto;

  @Expose()
  @ApiProperty({ description: 'ID người báo lỗi' })
  reporterId: string;

  @Expose()
  @Type(() => UserInfoDto)
  @ApiPropertyOptional({ description: 'Thông tin người báo lỗi', type: UserInfoDto })
  reporter?: UserInfoDto;

  @Expose()
  @ApiPropertyOptional({ description: 'ID kỹ thuật viên được phân công' })
  assignedTechnicianId?: string;

  @Expose()
  @Type(() => UserInfoDto)
  @ApiPropertyOptional({ description: 'Thông tin kỹ thuật viên', type: UserInfoDto })
  assignedTechnician?: UserInfoDto;

  @Expose()
  @ApiPropertyOptional({ 
    description: 'Loại lỗi',
    enum: ErrorType
  })
  errorType?: ErrorType;

  @Expose()
  @ApiProperty({ description: 'Mô tả chi tiết lỗi' })
  description: string;

  @Expose()
  @ApiPropertyOptional({ 
    description: 'Mảng URL ảnh/video minh họa',
    type: [String]
  })
  mediaUrls?: string[];

  @Expose()
  @ApiProperty({ 
    description: 'Trạng thái yêu cầu',
    enum: RepairStatus
  })
  status: RepairStatus;

  @Expose()
  @ApiPropertyOptional({ description: 'Ghi chú kết quả xử lý' })
  resolutionNotes?: string;

  @Expose()
  @ApiProperty({ description: 'Thời điểm báo lỗi' })
  createdAt: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Thời điểm tiếp nhận' })
  acceptedAt?: Date;

  @Expose()
  @ApiPropertyOptional({ description: 'Thời điểm hoàn tất' })
  completedAt?: Date;
}
