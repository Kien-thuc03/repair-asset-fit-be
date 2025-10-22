import { Expose, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

class AssetInfoDto {
  @Expose()
  @ApiProperty({ description: "ID của tài sản" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Mã kế toán tài sản" })
  ktCode: string;

  @Expose()
  @ApiProperty({ description: "Mã tài sản cố định" })
  fixedCode: string;

  @Expose()
  @ApiProperty({ description: "Tên tài sản" })
  name: string;

  @Expose()
  @ApiProperty({ description: "Loại tài sản" })
  type: string;

  @Expose()
  @ApiProperty({ description: "Trạng thái tài sản" })
  status: string;
}

class SoftwareInfoDto {
  @Expose()
  @ApiProperty({ description: "ID phần mềm" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Tên phần mềm" })
  name: string;

  @Expose()
  @ApiProperty({ description: "Phiên bản" })
  version: string;

  @Expose()
  @ApiProperty({ description: "Nhà phát hành" })
  publisher: string;
}

class RoomInfoDto {
  @Expose()
  @ApiProperty({ description: "ID phòng" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Tên phòng" })
  name: string;

  @Expose()
  @ApiProperty({ description: "Tòa nhà" })
  building: string;

  @Expose()
  @ApiProperty({ description: "Tầng" })
  floor: string;

  @Expose()
  @ApiProperty({ description: "Số phòng" })
  roomNumber: string;
}

export class AssetSoftwareResponseDto {
  @Expose()
  @ApiProperty({
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  assetId: string;

  @Expose()
  @ApiProperty({
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  softwareId: string;

  @Expose()
  @ApiPropertyOptional({
    description: "Ngày cài đặt phần mềm",
    example: "2024-01-15",
  })
  installationDate?: Date;

  @Expose()
  @ApiPropertyOptional({
    description: "Ghi chú về việc cài đặt",
    example: "License key: ABCD-EFGH-IJKL-MNOP",
  })
  notes?: string;

  @Expose()
  @Type(() => AssetInfoDto)
  @ApiPropertyOptional({ description: "Thông tin tài sản", type: AssetInfoDto })
  asset?: AssetInfoDto;

  @Expose()
  @Type(() => SoftwareInfoDto)
  @ApiPropertyOptional({
    description: "Thông tin phần mềm",
    type: SoftwareInfoDto,
  })
  software?: SoftwareInfoDto;

  @Expose()
  @Type(() => RoomInfoDto)
  @ApiPropertyOptional({ description: "Thông tin phòng", type: RoomInfoDto })
  room?: RoomInfoDto;
}
