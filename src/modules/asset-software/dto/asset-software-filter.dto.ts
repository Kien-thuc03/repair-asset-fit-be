import { IsOptional, IsUUID, IsString, IsEnum } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { BaseFilterDto } from "src/common/dto/base-filter.dto";
import { PaginationDto } from "src/common/dto/pagination.dto";
import { Transform } from "class-transformer";

export class AssetSoftwareFilterDto extends PaginationDto {
  @ApiPropertyOptional({
    description: "Lọc theo ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @IsOptional()
  @IsUUID(4)
  assetId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @IsOptional()
  @IsUUID(4)
  softwareId?: string;

  @ApiPropertyOptional({
    description: "Tìm kiếm theo tên tài sản hoặc tên phần mềm",
    example: "Microsoft Office",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Sắp xếp theo trường",
    example: "installationDate",
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Thứ tự sắp xếp",
    enum: ["ASC", "DESC"],
    example: "DESC",
  })
  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC";
}
