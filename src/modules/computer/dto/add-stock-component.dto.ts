import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO cho việc thêm linh kiện mới về kho
 * Được sử dụng khi có linh kiện mới được mua về và cần cập nhật vào hệ thống
 * Thông tin linh kiện mới (tên, specs) sẽ tự động lấy từ replacement_items
 */
export class AddStockComponentDto {
  @ApiProperty({
    description:
      "ID của linh kiện cũ (sẽ tự động lấy thông tin newItemName, newItemSpecs từ replacement_items)",
    example: "c2179e7d-fca7-4020-b89d-3cebf773e1a4",
  })
  @IsNotEmpty({ message: "ID linh kiện cũ không được để trống" })
  @IsUUID("4", { message: "ID linh kiện cũ phải là UUID hợp lệ" })
  oldComponentId: string;

  @ApiPropertyOptional({
    description:
      "Số serial của linh kiện mới (tùy chọn, nếu linh kiện có serial)",
    example: "SN123456789ABC",
  })
  @IsOptional()
  @IsString({ message: "Số serial phải là chuỗi" })
  serialNumber?: string;

  @ApiPropertyOptional({
    description: "Ghi chú bổ sung (tùy chọn)",
    example: "Đã kiểm tra chất lượng",
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi" })
  notes?: string;
}
