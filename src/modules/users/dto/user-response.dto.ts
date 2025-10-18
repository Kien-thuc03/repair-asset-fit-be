import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";
import { UserStatus } from "src/entities/user.entity";

// Renamed from RoleResponseDto to avoid conflict with roles module
export class UserRoleDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "Admin" })
  name: string;

  @ApiProperty({ example: "ADMIN" })
  code: string;
}

export class UserResponseDto {
  @ApiProperty({ example: "uuid" })
  @Expose()
  id: string;

  @ApiProperty({ example: "john_doe" })
  @Expose()
  username: string;

  @ApiProperty({ example: "John Doe" })
  @Expose()
  fullName: string;

  @ApiProperty({ example: "john.doe@example.com" })
  @Expose()
  email: string;

  @ApiProperty({ example: "+84901234567", required: false })
  @Expose()
  phoneNumber?: string;

  @ApiProperty({ example: "1990-01-01", required: false })
  @Expose()
  birthDate?: string;

  @ApiProperty({ example: UserStatus.ACTIVE, enum: UserStatus })
  @Expose()
  status: UserStatus;

  @ApiProperty({ type: [UserRoleDto], required: false })
  @Expose()
  roles?: UserRoleDto[];
}
