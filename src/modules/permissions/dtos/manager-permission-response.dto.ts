import { ApiProperty } from "@nestjs/swagger";

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

  @ApiProperty({ 
    example: "2024-01-01T00:00:00.000Z", 
    description: "Creation timestamp",
    required: false,
  })
  createdAt?: Date;

  @ApiProperty({ 
    example: "2024-01-01T00:00:00.000Z", 
    description: "Last update timestamp",
    required: false,
  })
  updatedAt?: Date;
}

export class ManagerPermissionResponseDto {
  @ApiProperty({ 
    example: "uuid", 
    description: "Manager Permission ID" 
  })
  id: string;

  @ApiProperty({ 
    example: "Admin", 
    description: "Manager Permission name" 
  })
  name: string;

  @ApiProperty({ 
    example: "admin", 
    description: "Manager Permission code",
    required: false,
  })
  code?: string;

  @ApiProperty({ 
    type: [PermissionResponseDto],
    description: "List of permissions assigned to this manager permission",
  })
  permissions?: PermissionResponseDto[];
}
