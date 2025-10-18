import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsUUID, MaxLength, Matches } from 'class-validator';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
    @ApiProperty({ 
        example: 'Kỹ thuật viên chính', 
        description: 'Role name (Tên vai trò)',
        maxLength: 255,
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(255, { message: 'Name must not exceed 255 characters' })
    name?: string;

    @ApiProperty({ 
        example: 'KY_THUAT_VIEN_CHINH', 
        description: 'Role code (Mã vai trò) - unique, UPPER_SNAKE_CASE',
        maxLength: 100,
        pattern: '^[A-Z_]+$',
        required: false,
    })
    @IsOptional()
    @IsString()
    @MaxLength(100, { message: 'Code must not exceed 100 characters' })
    @Matches(/^[A-Z_]+$/, {
        message: 'Code must be uppercase letters and underscores only (UPPER_SNAKE_CASE)',
    })
    code?: string;

    @ApiProperty({ 
        example: ['perm-uuid-3', 'perm-uuid-4'], 
        description: 'Array of permission IDs to assign (replaces existing permissions)',
        type: [String],
        required: false
    })
    @IsOptional()
    @IsArray()
    @IsUUID('4', { each: true, message: 'Each permission ID must be a valid UUID' })
    permissionIds?: string[];
}
