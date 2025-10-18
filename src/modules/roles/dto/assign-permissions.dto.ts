import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AssignPermissionsToRoleDto {
  @ApiProperty({
    description: 'Role ID to assign permissions to',
    example: 'role-uuid-1',
  })
  @IsUUID('4', { message: 'Role ID must be a valid UUID' })
  roleId: string;

  @ApiProperty({
    description: 'Array of permission IDs to assign to the role',
    type: [String],
    example: ['perm-uuid-1', 'perm-uuid-2', 'perm-uuid-3'],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one permission ID is required' })
  @IsUUID('4', { each: true, message: 'Each permission ID must be a valid UUID' })
  permissionIds: string[];
}

export class BulkAssignPermissionsDto {
  @ApiProperty({
    description: 'Array of role-permission assignments',
    type: [AssignPermissionsToRoleDto],
    example: [
      {
        roleId: 'role-uuid-1',
        permissionIds: ['perm-uuid-1', 'perm-uuid-2']
      },
      {
        roleId: 'role-uuid-2',
        permissionIds: ['perm-uuid-5', 'perm-uuid-6', 'perm-uuid-7']
      }
    ]
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one assignment is required' })
  @ValidateNested({ each: true })
  @Type(() => AssignPermissionsToRoleDto)
  assignments: AssignPermissionsToRoleDto[];
}
