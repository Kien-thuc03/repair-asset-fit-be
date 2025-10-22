import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsString,
  IsDateString,
} from "class-validator";
import { SoftwareProposalStatus } from "../../../common/shared/SoftwareProposalStatus";

export class SoftwareProposalFilterDto {
  @ApiPropertyOptional({
    description: "Lọc theo ID phòng",
    format: "uuid",
    example: "48b11d82-dee9-4003-b34d-d6063cbb230a",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID phòng phải là UUID hợp lệ" })
  roomId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ID người tạo đề xuất",
    format: "uuid",
    example: "fb8c94eb-9088-4215-be87-0a5736e0b72c",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID người tạo phải là UUID hợp lệ" })
  proposerId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ID người duyệt",
    format: "uuid",
    example: "fb8c94eb-9088-4215-be87-0a5736e0b72c",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID người duyệt phải là UUID hợp lệ" })
  approverId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo trạng thái đề xuất",
    enum: SoftwareProposalStatus,
    enumName: "SoftwareProposalStatus",
  })
  @IsOptional()
  @IsEnum(SoftwareProposalStatus, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(SoftwareProposalStatus).join(", ")}`,
  })
  status?: SoftwareProposalStatus;

  @ApiPropertyOptional({
    description: "Tìm kiếm theo mã đề xuất hoặc lý do",
    example: "DXPM-2025",
  })
  @IsOptional()
  @IsString({ message: "Từ khóa tìm kiếm phải là chuỗi ký tự" })
  search?: string;

  @ApiPropertyOptional({
    description: "Lọc từ ngày tạo (ISO string)",
    example: "2025-01-01",
  })
  @IsOptional()
  @IsDateString({}, { message: "Ngày bắt đầu phải có định dạng ISO date" })
  fromDate?: string;

  @ApiPropertyOptional({
    description: "Lọc đến ngày tạo (ISO string)",
    example: "2025-12-31",
  })
  @IsOptional()
  @IsDateString({}, { message: "Ngày kết thúc phải có định dạng ISO date" })
  toDate?: string;

  @ApiPropertyOptional({
    description: "Số trang (bắt đầu từ 1)",
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  page?: number = 1;

  @ApiPropertyOptional({
    description: "Số lượng bản ghi trên mỗi trang",
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: "Trường sắp xếp",
    enum: ["createdAt", "proposalCode", "status"],
    default: "createdAt",
    example: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: "createdAt" | "proposalCode" | "status" = "createdAt";

  @ApiPropertyOptional({
    description: "Thứ tự sắp xếp",
    enum: ["ASC", "DESC"],
    default: "DESC",
    example: "DESC",
  })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC" = "DESC";
}
