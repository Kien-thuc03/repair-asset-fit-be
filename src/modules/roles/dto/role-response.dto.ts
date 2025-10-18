import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";

export class PermissionResponseDto {
    @ApiProperty({ 
        example: "perm-1", 
        description: "Permission ID" 
    })
    id: string;

    @ApiProperty({ 
        example: "Báo cáo sự cố", 
        description: "Permission name" 
    })
    name: string;

    @ApiProperty({ 
        example: "report_issues", 
        description: "Permission code (unique identifier)" 
    })
    code: string;
}

export class RoleResponseDto {
    @ApiProperty({ 
        example: "role-1", 
        description: "Role ID" 
    })
    @Expose()
    id: string;

    @ApiProperty({ 
        example: "Giảng viên", 
        description: "Role name (Tên vai trò)" 
    })
    @Expose()
    name: string;

    @ApiProperty({ 
        example: "GIANG_VIEN", 
        description: "Role code (Mã vai trò - unique identifier)" 
    })
    @Expose()
    code: string;

    @ApiProperty({ 
        type: [PermissionResponseDto],
        description: "List of permissions assigned to this role",
    })
    @Expose()
    @Type(() => PermissionResponseDto)
    permissions?: PermissionResponseDto[];

    @ApiProperty({ 
        example: "2024-01-01T00:00:00.000Z", 
        description: "Creation timestamp",
        required: false,
    })
    @Expose()
    createdAt?: Date;

    @ApiProperty({ 
        example: "2024-01-01T00:00:00.000Z", 
        description: "Last update timestamp",
        required: false,
    })
    @Expose()
    updatedAt?: Date;
}
