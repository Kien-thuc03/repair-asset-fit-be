import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  ArrayMinSize,
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
}
