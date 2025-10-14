import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, MinLength, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from '../utils/constants';

export class RegisterDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address' 
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password',
    minLength: 6 
  })
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ 
    example: 'John',
    description: 'User first name' 
  })
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ 
    example: 'Doe',
    description: 'User last name' 
  })
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ 
    example: '+1234567890',
    description: 'User phone number',
    required: false 
  })
  @IsOptional()
  phone?: string;

  @ApiProperty({ 
    example: UserRole.USER,
    description: 'User role',
    enum: UserRole,
    required: false,
    default: UserRole.USER 
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}