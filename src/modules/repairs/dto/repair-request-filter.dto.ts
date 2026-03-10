import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsUUID,
  IsEnum,
  IsString,
  IsDateString,
} from "class-validator";
import { RepairStatus } from "src/common/shared/RepairStatus";
import { ErrorType } from "src/common/shared/ErrorType";

export class RepairRequestFilterDto {
  @ApiPropertyOptional({
    description: "Lọc theo ID tài sản (máy tính)",
    format: "uuid",
    example: "48b11d82-dee9-4003-b34d-d6063cbb230a",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID tài sản phải là UUID hợp lệ" })
  computerAssetId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ID người báo lỗi",
    format: "uuid",
    example: "c6660b91-ef5e-4726-b003-b4f7980a8e90",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID người báo lỗi phải là UUID hợp lệ" })
  reporterId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ID kỹ thuật viên được phân công",
    format: "uuid",
    example: "5c345ca6-02aa-41ef-924d-1fb427ce6e1c",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID kỹ thuật viên phải là UUID hợp lệ" })
  assignedTechnicianId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo trạng thái yêu cầu sửa chữa",
    enum: RepairStatus,
    enumName: "RepairStatus",
  })
  @IsOptional()
  @IsEnum(RepairStatus, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(RepairStatus).join(", ")}`,
  })
  status?: RepairStatus;

  @ApiPropertyOptional({
    description: "Lọc theo loại lỗi",
    enum: ErrorType,
    enumName: "ErrorType",
  })
  @IsOptional()
  @IsEnum(ErrorType, {
    message: `Loại lỗi phải là một trong các giá trị: ${Object.values(ErrorType).join(", ")}`,
  })
  errorType?: ErrorType;

  @ApiPropertyOptional({
    description: "Tìm kiếm theo mã yêu cầu hoặc mô tả",
    example: "YCSC-2025",
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
    enum: ["createdAt", "requestCode", "status"],
    default: "createdAt",
    example: "createdAt",
  })
  @IsOptional()
  @IsString()
  sortBy?: "createdAt" | "requestCode" | "status" = "createdAt";

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
