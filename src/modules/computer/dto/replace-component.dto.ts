import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO cho việc thay thế linh kiện trong máy tính
 * Được sử dụng khi hoàn thành đề xuất thay thế linh kiện
 */
export class ReplaceComponentDto {
  @ApiProperty({
    description:
      "ID của linh kiện cũ cần thay thế (sẽ chuyển status sang REMOVED)",
    example: "21f98edb-fda6-41ab-8f6c-dd56ebd72a59",
  })
  @IsNotEmpty({ message: "ID linh kiện cũ không được để trống" })
  @IsUUID("4", { message: "ID linh kiện cũ phải là UUID hợp lệ" })
  oldComponentId: string;

  @ApiProperty({
    description: "Tên linh kiện mới",
    example: "RAM",
  })
  @IsNotEmpty({ message: "Tên linh kiện mới không được để trống" })
  @IsString({ message: "Tên linh kiện mới phải là chuỗi" })
  newItemName: string;

  @ApiProperty({
    description: "Thông số kỹ thuật của linh kiện mới",
    example: "16GB DDR3 1600MHz",
  })
  @IsNotEmpty({ message: "Thông số kỹ thuật không được để trống" })
  @IsString({ message: "Thông số kỹ thuật phải là chuỗi" })
  newItemSpecs: string;

  @ApiPropertyOptional({
    description: "Số serial của linh kiện mới (nếu có)",
    example: "SN123456789",
  })
  @IsOptional()
  @IsString({ message: "Số serial phải là chuỗi" })
  serialNumber?: string;

  @ApiPropertyOptional({
    description: "Ghi chú về việc thay thế",
    example: "Thay thế do linh kiện cũ hỏng",
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi" })
  notes?: string;

  @ApiPropertyOptional({
    description:
      "ID của linh kiện mới đã được mua sắm (nếu có). Nếu có ID này, hệ thống sẽ cập nhật trạng thái linh kiện từ IN_STOCK sang INSTALLED thay vì tạo mới.",
  })
  @IsOptional()
  @IsUUID("4", { message: "ID linh kiện mới phải là UUID hợp lệ" })
  newlyPurchasedComponentId?: string;
}

/**
 * DTO cho việc thay thế nhiều linh kiện cùng lúc
 */
export class ReplaceMultipleComponentsDto {
  @ApiProperty({
    description: "Danh sách các linh kiện cần thay thế",
    type: [ReplaceComponentDto],
  })
  @IsNotEmpty({ message: "Danh sách linh kiện không được để trống" })
  components: ReplaceComponentDto[];
}
