import { IsString, IsOptional, IsDateString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAssetSoftwareDto {
  @ApiProperty({
    description: "ID của máy tính/tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID(4, { message: "Asset ID phải là UUID hợp lệ" })
  @IsString()
  assetId: string;

  @ApiProperty({
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID(4, { message: "Software ID phải là UUID hợp lệ" })
  @IsString()
  softwareId: string;

  @ApiPropertyOptional({
    description: "Ngày cài đặt phần mềm",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Installation date phải là định dạng ngày hợp lệ (YYYY-MM-DD)" }
  )
  installationDate?: string;

  @ApiPropertyOptional({
    description: "Ghi chú về việc cài đặt (ví dụ: key license)",
    example: "License key: ABCD-EFGH-IJKL-MNOP",
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
