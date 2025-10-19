import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
  IsEnum,
  IsDateString,
  IsArray,
} from 'class-validator';
import { UserStatus } from 'src/entities/user.entity';

export class UpdateUserDto {
  @ApiPropertyOptional({
    description: 'Tên đăng nhập của người dùng',
    example: 'john_doe',
    minLength: 3,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
  @MaxLength(50, { message: 'Tên đăng nhập không được vượt quá 50 ký tự' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới',
  })
  username?: string;

  @ApiPropertyOptional({
    description: 'Mật khẩu mới (nếu muốn đổi)',
    example: 'NewPassword@123',
    minLength: 8,
  })
  @IsOptional()
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Mật khẩu phải có ít nhất 8 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  password?: string;

  @ApiPropertyOptional({
    description: 'Họ và tên đầy đủ của người dùng',
    example: 'Nguyễn Văn A',
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  fullName?: string;

  @ApiPropertyOptional({
    description: 'Email của người dùng',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @MaxLength(100, { message: 'Email không được vượt quá 100 ký tự' })
  email?: string;

  @ApiPropertyOptional({
    description: 'ID của đơn vị công tác',
    example: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ID đơn vị phải là UUID hợp lệ' })
  unitId?: string;

  @ApiPropertyOptional({
    description: 'Số điện thoại của người dùng',
    example: '+84901234567',
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^(\+84|0)[0-9]{9,10}$/, {
    message: 'Số điện thoại không hợp lệ (định dạng Việt Nam)',
  })
  phoneNumber?: string;

  @ApiPropertyOptional({
    description: 'Ngày sinh của người dùng',
    example: '1990-01-01',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày sinh phải theo định dạng YYYY-MM-DD' })
  birthDate?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái của người dùng',
    enum: UserStatus,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;

  @ApiPropertyOptional({
    description: 'Danh sách ID các vai trò của người dùng',
    type: [String],
    example: ['uuid-role-1', 'uuid-role-2'],
  })
  @IsOptional()
  @IsArray({ message: 'Danh sách vai trò phải là mảng' })
  @IsUUID('4', { each: true, message: 'Mỗi ID vai trò phải là UUID hợp lệ' })
  roleIds?: string[];
}
