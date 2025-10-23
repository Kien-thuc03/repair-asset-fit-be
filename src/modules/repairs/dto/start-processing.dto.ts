import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsNumber,
  Min,
  Max,
} from "class-validator";

export class StartProcessingDto {
  @ApiProperty({
    description: "Ghi chú về quá trình xử lý",
    maxLength: 1000,
    example:
      "Bắt đầu kiểm tra sự cố máy tính không khởi động được. Dự kiến thời gian xử lý: 2 giờ.",
  })
  @IsNotEmpty({ message: "Ghi chú xử lý không được để trống" })
  @IsString({ message: "Ghi chú phải là chuỗi ký tự" })
  @MaxLength(1000, { message: "Ghi chú không được vượt quá 1000 ký tự" })
  processingNotes: string;

  @ApiPropertyOptional({
    description: "Thời gian ước tính xử lý (phút)",
    minimum: 5,
    maximum: 480, // 8 giờ
    example: 120,
  })
  @IsOptional()
  @IsNumber({}, { message: "Thời gian ước tính phải là số" })
  @Min(5, { message: "Thời gian ước tính tối thiểu 5 phút" })
  @Max(480, { message: "Thời gian ước tính tối đa 480 phút (8 giờ)" })
  estimatedTime?: number;
}
