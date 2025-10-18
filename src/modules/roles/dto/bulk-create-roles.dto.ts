import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateRoleDto } from './create-role.dto';

export class BulkCreateRolesDto {
  @ApiProperty({
    description: 'Array of roles to create',
    type: [CreateRoleDto],
    example: [
      {
        name: 'Giảng viên',
        code: 'GIANG_VIEN',
        permissionIds: []
      },
      {
        name: 'Kỹ thuật viên',
        code: 'KY_THUAT_VIEN',
        permissionIds: []
      },
      {
        name: 'Tổ trưởng Kỹ thuật',
        code: 'TO_TRUONG_KY_THUAT',
        permissionIds: []
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one role is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateRoleDto)
  roles: CreateRoleDto[];
}
