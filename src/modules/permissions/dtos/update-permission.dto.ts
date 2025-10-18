import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength, Matches } from 'class-validator';
import { CreatePermissionDto } from './create-permission.dto';

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {
  @ApiProperty({
    example: 'Báo cáo sự cố máy tính',
    description: 'Tên quyền (Permission name)',
    maxLength: 255,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Name must not exceed 255 characters' })
  name?: string;

  @ApiProperty({
    example: 'report_computer_issues',
    description: 'Mã quyền (Permission code) - unique, snake_case',
    maxLength: 100,
    pattern: '^[a-z_]+$',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Code must not exceed 100 characters' })
  @Matches(/^[a-z_]+$/, {
    message: 'Code must be lowercase letters and underscores only (snake_case)',
  })
  code?: string;
}
