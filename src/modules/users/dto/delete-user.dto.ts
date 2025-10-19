import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class DeleteUserDto {
  @ApiPropertyOptional({
    description:
      'Xóa vĩnh viễn (hard delete) hoặc xóa mềm (soft delete). Mặc định là false (soft delete)',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Tham số hard phải là kiểu boolean' })
  hard?: boolean;
}
