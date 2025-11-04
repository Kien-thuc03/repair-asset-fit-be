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

// DTO for Unit information in User response
export class UserUnitDto {
  @ApiProperty({ example: "uuid" })
  id: string;

  @ApiProperty({ example: "Khoa Công nghệ Thông tin" })
  name: string;

  @ApiProperty({ example: "đơn_vị_sử_dụng" })
  type: string;
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

  @ApiProperty({ type: UserUnitDto, required: false, description: "Thông tin đơn vị" })
  @Expose()
  unit?: UserUnitDto;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z", description: "Ngày tạo" })
  @Expose()
  createdAt: Date;

  @ApiProperty({ example: "2024-01-01T00:00:00.000Z", description: "Ngày cập nhật" })
  @Expose()
  updatedAt: Date;
}
