import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserStatus } from 'src/entities/user.entity';

export class QueryUserDto {
  @ApiPropertyOptional({
    description: 'Tìm kiếm theo tên đăng nhập, họ tên hoặc email',
    example: 'john',
  })
  @IsOptional()
  @IsString({ message: 'Từ khóa tìm kiếm phải là chuỗi ký tự' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo trạng thái người dùng',
    enum: UserStatus,
    example: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Lọc theo ID đơn vị',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID đơn vị phải là UUID hợp lệ' })
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo ID vai trò',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID vai trò phải là UUID hợp lệ' })
  roleId?: string;

  @ApiPropertyOptional({
    description: 'Số trang',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Số trang phải là số nguyên' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi trên mỗi trang',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Kích thước trang phải là số nguyên' })
  @Min(1, { message: 'Kích thước trang phải lớn hơn hoặc bằng 1' })
  @Max(100, { message: 'Kích thước trang không được vượt quá 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sắp xếp theo trường (fullName, email, createdAt, updatedAt)',
    example: 'createdAt',
    default: 'createdAt',
  })
  @IsOptional()
  @IsString({ message: 'Trường sắp xếp phải là chuỗi ký tự' })
  sortBy?: string = 'createdAt';

  @ApiPropertyOptional({
    description: 'Thứ tự sắp xếp (ASC hoặc DESC)',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Thứ tự sắp xếp phải là ASC hoặc DESC' })
  sortOrder?: 'ASC' | 'DESC' = 'DESC';
}
