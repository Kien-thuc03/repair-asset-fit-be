import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  Matches,
  IsEnum,
  IsDateString,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { UserStatus } from 'src/entities/user.entity';

export class CreateUserDto {
  @ApiProperty({
    description: 'Tên đăng nhập của người dùng (mã nhân viên - 8 chữ số)',
    example: '10000001',
    minLength: 8,
    maxLength: 8,
  })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @Matches(/^[0-9]{8}$/, {
    message: 'Tên đăng nhập phải là chuỗi gồm đúng 8 chữ số',
  })
  username: string;

  @ApiProperty({
    description: 'Mật khẩu của người dùng',
    example: 'Password@123',
    minLength: 8,
  })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt',
  })
  password: string;

  @ApiProperty({
    description: 'Họ và tên đầy đủ của người dùng',
    example: 'Nguyễn Văn A',
    maxLength: 100,
  })
  @IsString({ message: 'Họ tên phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @MaxLength(100, { message: 'Họ tên không được vượt quá 100 ký tự' })
  fullName: string;

  @ApiProperty({
    description: 'Email của người dùng',
    example: 'john.doe@example.com',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @MaxLength(100, { message: 'Email không được vượt quá 100 ký tự' })
  email: string;

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
  @Matches(/^(\+84|84|0)(3|5|7|8|9)[0-9]{8}$/, {
    message: 'Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567, +84901234567)',
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
    default: UserStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Trạng thái không hợp lệ' })
  status?: UserStatus;

  @ApiProperty({
    description: 'Danh sách ID các vai trò của người dùng (bắt buộc ít nhất 1)',
    type: [String],
    example: ['uuid-role-1', 'uuid-role-2'],
  })
  @IsNotEmpty({ message: 'Danh sách vai trò không được để trống' })
  @IsArray({ message: 'Danh sách vai trò phải là mảng' })
  @ArrayMinSize(1, { message: 'Phải chọn ít nhất một vai trò' })
  @IsUUID('4', { each: true, message: 'Mỗi ID vai trò phải là UUID hợp lệ' })
  roleIds: string[];
}
