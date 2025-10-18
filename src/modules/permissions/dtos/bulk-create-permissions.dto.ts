import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreatePermissionDto } from './create-permission.dto';

export class BulkCreatePermissionsDto {
  @ApiProperty({
    description: 'Array of permissions to create',
    type: [CreatePermissionDto],
    example: [
      {
        name: 'Báo cáo sự cố',
        code: 'report_issues',
      },
      {
        name: 'Theo dõi tiến độ xử lý',
        code: 'track_progress',
      },
      {
        name: 'Tra cứu thiết bị',
        code: 'search_equipment',
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one permission is required' })
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  permissions: CreatePermissionDto[];
}
