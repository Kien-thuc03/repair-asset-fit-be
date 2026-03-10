import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  IsUUID,
} from "class-validator";
import { CreateReplacementItemDto } from "./create-replacement-item.dto";

export class CreateReplacementProposalDto {
  @ApiPropertyOptional({ description: "Tiêu đề đề xuất" })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ description: "Mô tả chi tiết đề xuất" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: "Danh sách linh kiện cần thay thế",
    type: [CreateReplacementItemDto],
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: "Phải có ít nhất 1 linh kiện cần thay thế" })
  @ValidateNested({ each: true })
  @Type(() => CreateReplacementItemDto)
  items: CreateReplacementItemDto[];

  @ApiPropertyOptional({
    description: "Danh sách ID các yêu cầu sửa chữa liên quan (để tạo liên kết trong bảng proposal_repair_requests)",
    type: [String],
    example: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true, message: "Mỗi repairRequestId phải là UUID hợp lệ" })
  repairRequestIds?: string[];
}
