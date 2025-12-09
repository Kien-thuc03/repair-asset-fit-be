import { IsNotEmpty, IsOptional, IsString, IsEnum, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ComponentType } from "../../../common/shared/ComponentType";

/**
 * DTO cho việc thêm linh kiện mới vào kho
 * Linh kiện sẽ được tạo với status IN_STOCK
 */
export class CreateComponentDto {
  @ApiPropertyOptional({
    description: "ID của máy tính/asset để lưu linh kiện (optional - để null nếu chỉ nhập kho, chưa lắp đặt)",
  })
  @IsOptional()
  @IsUUID("4", { message: "ID máy tính phải là UUID hợp lệ" })
  computerAssetId?: string | null;

  @ApiProperty({
    description: "Loại linh kiện",
    enum: ComponentType,
  })
  @IsNotEmpty({ message: "Loại linh kiện không được để trống" })
  @IsEnum(ComponentType, { message: "Loại linh kiện không hợp lệ" })
  componentType: ComponentType;

  @ApiProperty({
    description: "Tên/Model của linh kiện",
  })
  @IsNotEmpty({ message: "Tên linh kiện không được để trống" })
  @IsString({ message: "Tên linh kiện phải là chuỗi" })
  name: string;

  @ApiPropertyOptional({
    description: "Thông số kỹ thuật chi tiết của linh kiện",
  })
  @IsOptional()
  @IsString({ message: "Thông số kỹ thuật phải là chuỗi" })
  componentSpecs?: string;

  @ApiPropertyOptional({
    description: "Số serial của linh kiện (nếu có)",
  })
  @IsOptional()
  @IsString({ message: "Số serial phải là chuỗi" })
  serialNumber?: string;

  @ApiPropertyOptional({
    description: "Ghi chú bổ sung",
    example: "Linh kiện mới nhập kho",
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi" })
  notes?: string;
}

