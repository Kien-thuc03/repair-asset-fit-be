import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsInt, Min, IsOptional, IsUUID } from "class-validator";

export class CreateReplacementItemDto {
  @ApiPropertyOptional({ description: "ID linh kiện cũ cần thay (nếu có)" })
  @IsOptional()
  @IsUUID()
  oldComponentId?: string;

  @ApiProperty({ description: "Tên linh kiện/thiết bị mới cần mua" })
  @IsString()
  newItemName: string;

  @ApiPropertyOptional({ description: "Thông số kỹ thuật chi tiết" })
  @IsOptional()
  @IsString()
  newItemSpecs?: string;

  @ApiProperty({ description: "Số lượng", default: 1, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity: number = 1;

  @ApiPropertyOptional({ description: "Lý do cần thay thế" })
  @IsOptional()
  @IsString()
  reason?: string;
}
