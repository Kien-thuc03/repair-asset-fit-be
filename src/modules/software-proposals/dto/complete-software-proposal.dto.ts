import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsUUID,
  IsDateString,
  IsInt,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

/**
 * DTO cho thông tin phần mềm khi hoàn thành đề xuất
 */
export class SoftwareInfoDto {
  @ApiProperty({
    description: "ID của proposal item",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsUUID(4, { message: "ID proposal item phải là UUID hợp lệ" })
  itemId: string;

  @ApiPropertyOptional({
    description: "Tên phần mềm (nếu khác với tên trong đề xuất)",
    example: "Microsoft Office 2021 Professional Plus",
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "Tên phần mềm phải là chuỗi ký tự" })
  name?: string;

  @ApiPropertyOptional({
    description: "Phiên bản phần mềm (nếu khác với phiên bản trong đề xuất)",
    example: "2021",
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: "Phiên bản phải là chuỗi ký tự" })
  version?: string;

  @ApiPropertyOptional({
    description: "Nhà sản xuất (nếu khác với nhà sản xuất trong đề xuất)",
    example: "Microsoft Corporation",
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "Nhà sản xuất phải là chuỗi ký tự" })
  publisher?: string;
}

/**
 * DTO cho thông tin cài đặt phần mềm trên máy tính
 */
export class ComputerSoftwareInfoDto {
  @ApiProperty({
    description: "ID của máy tính",
    format: "uuid",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsUUID(4, { message: "ID máy tính phải là UUID hợp lệ" })
  computerId: string;

  @ApiPropertyOptional({
    description: "Ngày cài đặt phần mềm",
    example: "2025-01-15",
    format: "date",
  })
  @IsOptional()
  @IsDateString({}, { message: "Ngày cài đặt phải có định dạng ISO date" })
  installationDate?: string;

  @ApiPropertyOptional({
    description: "License key hoặc serial của phần mềm",
    example: "XXXXX-XXXXX-XXXXX-XXXXX-XXXXX",
    maxLength: 500,
  })
  @IsOptional()
  @IsString({ message: "License key phải là chuỗi ký tự" })
  licenseKey?: string;

  @ApiPropertyOptional({
    description: "Ghi chú về cài đặt",
    example: "Đã cài đặt thành công trên tất cả máy trong phòng",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi ký tự" })
  notes?: string;
}

/**
 * DTO để hoàn thành đề xuất phần mềm và cập nhật phần mềm cho các máy tính
 */
export class CompleteSoftwareProposalDto {
  @ApiProperty({
    description: "Danh sách thông tin phần mềm (để tạo/update trong bảng Software)",
    type: [SoftwareInfoDto],
  })
  @IsArray({ message: "Danh sách phần mềm phải là một mảng" })
  @ValidateNested({ each: true })
  @Type(() => SoftwareInfoDto)
  softwareInfo: SoftwareInfoDto[];

  @ApiPropertyOptional({
    description: "Ghi chú hoàn thành đề xuất",
    example: "Đã hoàn thành cài đặt phần mềm cho tất cả máy tính trong phòng",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi ký tự" })
  completionNotes?: string;
}

