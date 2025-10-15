import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../utils/constants';

export class UserResponseDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'admin' })
  username: string;

  @ApiProperty({ example: 'admin@example.com' })
  email: string;

  @ApiProperty({ example: 'Nguyễn' })
  firstName: string;

  @ApiProperty({ example: 'Văn A' })
  lastName: string;

  @ApiProperty({ example: '0123456789', required: false })
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.ADMIN })
  role: UserRole;
}

export class LoginResponseDto {
  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: 'JWT access token' 
  })
  access_token: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}
