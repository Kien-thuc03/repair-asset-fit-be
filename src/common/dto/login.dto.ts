import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ 
    example: 'admin or admin@example.com',
    description: 'Username hoặc email của người dùng' 
  })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'Mật khẩu người dùng',
    minLength: 6 
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;
}