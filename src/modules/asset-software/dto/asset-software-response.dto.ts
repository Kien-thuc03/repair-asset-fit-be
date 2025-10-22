import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AssetSoftwareResponseDto {
  @ApiProperty({
    description: "ID của máy tính/tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  assetId: string;

  @ApiProperty({
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  softwareId: string;

  @ApiPropertyOptional({
    description: "Ngày cài đặt phần mềm",
    example: "2024-01-15",
  })
  installationDate?: string;

  @ApiPropertyOptional({
    description: "Ghi chú về việc cài đặt",
    example: "License key: ABCD-EFGH-IJKL-MNOP",
  })
  notes?: string;

  @ApiPropertyOptional({
    description: "Thông tin chi tiết về tài sản",
  })
  asset?: {
    id: string;
    name: string;
    ktCode: string;
    fixedCode: string;
  };

  @ApiPropertyOptional({
    description: "Thông tin chi tiết về phần mềm",
  })
  software?: {
    id: string;
    name: string;
    version?: string;
    publisher?: string;
  };
}
