import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsArray, IsOptional, IsUUID, MaxLength, Matches } from "class-validator";

export class CreateRoleDto {
    @ApiProperty({ 
        example: 'Giảng viên', 
        description: 'Role name (Tên vai trò)',
        maxLength: 255,
    })
    @IsString()
    @IsNotEmpty({ message: 'Name is required' })
    @MaxLength(255, { message: 'Name must not exceed 255 characters' })
    name: string;

    @ApiProperty({ 
        example: 'GIANG_VIEN', 
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
        example: ['perm-uuid-1', 'perm-uuid-2'], 
        description: 'Array of permission IDs to assign to this role (Danh sách ID các quyền)',
        type: [String],
        required: false
    })
    @IsArray()
    @IsOptional()
    @IsUUID('4', { each: true, message: 'Each permission ID must be a valid UUID' })
    permissionIds?: string[];
}
