import { IsOptional, IsDateString, IsString, MaxLength } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateAssetSoftwareDto {
  @ApiPropertyOptional({
    description: "Ngày cài đặt phần mềm (để null nếu muốn xóa ngày cài đặt)",
    example: "2024-01-15",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Ngày cài đặt phải có định dạng hợp lệ (YYYY-MM-DD)" }
  )
  installationDate?: string | null;

  @ApiPropertyOptional({
    description: "Ghi chú về việc cài đặt (key license, cấu hình, v.v.)",
    example: "License key: ABCD-EFGH-IJKL-MNOP. Đã cập nhật cấu hình.",
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi" })
  @MaxLength(1000, { message: "Ghi chú không được vượt quá 1000 ký tự" })
  notes?: string;
}
