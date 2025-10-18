import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({
    example: '21012345',
    description: 'User username',
  })
  @IsNotEmpty()
  username: string;

  @ApiProperty({
    example: 'admin123',
    description: 'User password',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
