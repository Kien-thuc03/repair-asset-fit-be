import {
  IsOptional,
  IsUUID,
  IsString,
  IsEnum,
  IsInt,
  Min,
  Max,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class AssetSoftwareFilterDto {
  @ApiPropertyOptional({
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Số trang phải là số nguyên" })
  @Min(1, { message: "Số trang phải lớn hơn hoặc bằng 1" })
  page?: number;

  @ApiPropertyOptional({
    description: "Số lượng item trên mỗi trang",
    example: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "Limit phải là số nguyên" })
  @Min(1, { message: "Limit phải lớn hơn hoặc bằng 1" })
  @Max(100, { message: "Limit không được vượt quá 100" })
  limit?: number;

  @ApiPropertyOptional({
    description: "Lọc theo ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID("all", { message: "Asset ID phải là UUID hợp lệ" })
  assetId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsOptional()
  @IsUUID("all", { message: "Software ID phải là UUID hợp lệ" })
  softwareId?: string;

  @ApiPropertyOptional({
    description: "Tìm kiếm theo tên tài sản hoặc tên phần mềm",
    example: "Microsoft Office",
  })
  @IsOptional()
  @IsString({ message: "Từ khóa tìm kiếm phải là chuỗi" })
  search?: string;

  @ApiPropertyOptional({
    description: "Sắp xếp theo trường",
    example: "installationDate",
    enum: ["installationDate", "assetName", "softwareName"],
  })
  @IsOptional()
  @IsString({ message: "Trường sắp xếp phải là chuỗi" })
  @IsEnum(["installationDate", "assetName", "softwareName"], {
    message:
      "Trường sắp xếp phải là một trong: installationDate, assetName, softwareName",
  })
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Thứ tự sắp xếp",
    enum: ["ASC", "DESC"],
    example: "DESC",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"], {
    message: "Thứ tự sắp xếp phải là ASC hoặc DESC",
  })
  sortOrder?: "ASC" | "DESC";
}
