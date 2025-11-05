import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsString,
  IsDateString,
  IsInt,
  Min,
} from "class-validator";
import { Type } from "class-transformer";
import { ReplacementStatus } from "../../../common/shared/ReplacementStatus";

export class ReplacementProposalFilterDto {
  @ApiPropertyOptional({ description: "Lọc theo ID người đề xuất" })
  @IsOptional()
  @IsUUID()
  proposerId?: string;

  @ApiPropertyOptional({ description: "Lọc theo ID tổ trưởng kỹ thuật" })
  @IsOptional()
  @IsUUID()
  teamLeadApproverId?: string;

  @ApiPropertyOptional({ description: "Lọc theo ID admin xác minh" })
  @IsOptional()
  @IsUUID()
  adminVerifierId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo trạng thái",
    enum: ReplacementStatus,
  })
  @IsOptional()
  @IsEnum(ReplacementStatus)
  status?: ReplacementStatus;

  @ApiPropertyOptional({ description: "Tìm kiếm theo mã đề xuất hoặc tiêu đề" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Từ ngày (ISO string)" })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: "Đến ngày (ISO string)" })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({
    description: "Số trang (từ 1)",
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Số lượng/trang",
    default: 10,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Trường sắp xếp",
    enum: ["createdAt", "updatedAt", "proposalCode", "status"],
    default: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: string = "createdAt";

  @ApiPropertyOptional({
    description: "Thứ tự sắp xếp",
    enum: ["ASC", "DESC"],
    default: "DESC",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "DESC";
}
