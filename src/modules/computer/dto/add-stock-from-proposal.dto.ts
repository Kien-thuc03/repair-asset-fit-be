import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

/**
 * DTO cho việc thêm linh kiện mới về kho từ đề xuất
 * Cập nhật hàng loạt cho tất cả items trong đề xuất
 */
export class AddStockFromProposalDto {
  @ApiProperty({
    description: "ID của đề xuất thay thế",
    example: "ef6c626b-b3c1-4545-9a50-3c879aa79664",
  })
  @IsNotEmpty({ message: "ID đề xuất không được để trống" })
  @IsUUID("4", { message: "ID đề xuất phải là UUID hợp lệ" })
  proposalId: string;

  @ApiPropertyOptional({
    description: "Ghi chú chung cho các linh kiện nhập kho",
    example: "Nhập kho theo đề xuất DXTT-2025-0013",
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi" })
  notes?: string;
}
