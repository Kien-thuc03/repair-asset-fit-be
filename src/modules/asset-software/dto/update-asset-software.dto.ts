import { IsOptional, IsDateString, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateAssetSoftwareDto {
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
