import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsUUID,
  IsArray,
  MaxLength,
  IsEnum,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ErrorType } from "src/common/shared/ErrorType";

export class CreateRepairRequestDto {
  @ApiProperty({
    description: "ID của tài sản (máy tính) gặp sự cố",
    example: "48b11d82-dee9-4003-b34d-d6063cbb230a",
  })
  @IsNotEmpty({ message: "ID tài sản không được để trống" })
  @IsUUID("all", { message: "ID tài sản phải là UUID hợp lệ" })
  computerAssetId: string;

  @ApiPropertyOptional({
    description: "Loại lỗi",
    enum: ErrorType,
    example: ErrorType.MAY_KHONG_KHOI_DONG,
  })
  @IsOptional()
  @IsEnum(ErrorType, {
    message: "Loại lỗi phải là một trong các giá trị hợp lệ",
  })
  errorType?: ErrorType;

  @ApiProperty({
    description: "Mô tả chi tiết tình trạng lỗi",
    example: "Máy tình không khởi động được, có mùi cháy từ nguồn điện 500W",
  })
  @IsNotEmpty({ message: "Mô tả lỗi không được để trống" })
  @IsString({ message: "Mô tả lỗi phải là chuỗi" })
  @MaxLength(2000, { message: "Mô tả lỗi không được vượt quá 2000 ký tự" })
  description: string;

  @ApiPropertyOptional({
    description: "Mảng các đường dẫn ảnh/video minh họa lỗi",
    type: [String],
    example: [
      "https://example.com/image1.jpg",
      "https://example.com/image2.jpg",
    ],
  })
  @IsOptional()
  @IsArray({ message: "Media URLs phải là mảng" })
  @IsString({ each: true, message: "Mỗi URL phải là chuỗi" })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: "Danh sách ID các linh kiện gặp sự cố (nếu có)",
    type: [String],
    example: [
      "989e73df-40df-4e49-8d14-3be3f36adadb",
      "beca3f25-5353-4e13-8733-a961a0362e4b",
    ],
  })
  @IsOptional()
  @IsArray({ message: "Component IDs phải là mảng" })
  @IsUUID("all", {
    each: true,
    message: "Mỗi component ID phải là UUID hợp lệ",
  })
  componentIds?: string[];

  @ApiPropertyOptional({
    description:
      "Danh sách ID các phần mềm gặp sự cố (chỉ sử dụng khi errorType là MAY_HU_PHAN_MEM)",
    type: [String],
    example: [
      "d52a67b3-155f-4d30-8134-94de8fecf657",
      "1aa594ca-83f6-4b07-bad1-a6f88d5ece3f",
    ],
  })
  @IsOptional()
  @IsArray({ message: "Software IDs phải là mảng" })
  @IsUUID("all", {
    each: true,
    message: "Mỗi software ID phải là UUID hợp lệ",
  })
  softwareIds?: string[];
}
