import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsArray, IsString, IsBoolean, IsNumber, IsEnum, Min } from "class-validator";
import { Type, Transform } from "class-transformer";
import { ComponentType } from "../../../common/shared/ComponentType";
import { RepairStatus } from "../../../common/shared/RepairStatus";

/**
 * DTO cho thông tin linh kiện khả dụng từ yêu cầu sửa chữa
 * Dùng để hiển thị danh sách linh kiện có thể đưa vào đề xuất thay thế
 */
export class AvailableComponentDto {
  @ApiProperty({
    description: "ID của yêu cầu sửa chữa",
    example: "fda02b10-3ca8-4a17-9c16-97f3ca753ba4",
  })
  repairRequestId: string;

  @ApiProperty({
    description: "Mã yêu cầu sửa chữa",
    example: "YCSC-2025-0002",
  })
  requestCode: string;

  @ApiProperty({
    description: "Trạng thái yêu cầu sửa chữa",
    enum: RepairStatus,
    example: RepairStatus.ĐÃ_TIẾP_NHẬN,
  })
  repairStatus: RepairStatus;

  @ApiProperty({
    description: "Mô tả vấn đề từ yêu cầu sửa chữa",
    example: "Chuột không hoạt động, không di chuyển được con trỏ.",
  })
  repairDescription: string;

  @ApiProperty({
    description: "ID của linh kiện",
    example: "35560238-96ec-4242-9e17-be3a0e3b23cc",
  })
  componentId: string;

  @ApiProperty({
    description: "Tên linh kiện",
    example: "Kingston Fury Beast DDR4 16GB",
  })
  componentName: string;

  @ApiProperty({
    description: "Loại linh kiện",
    enum: ComponentType,
    example: ComponentType.RAM,
    nullable: true,
  })
  componentType?: ComponentType;

  @ApiProperty({
    description: "Thông số kỹ thuật của linh kiện",
    example: "DDR4, 16GB (2x8GB), 3200MHz, CL16",
    nullable: true,
  })
  componentSpecs?: string;

  @ApiProperty({
    description: "ID của tài sản (máy tính)",
    example: "48b11d82-dee9-4003-b34d-d6063cbb230a",
  })
  assetId: string;

  @ApiProperty({
    description: "Tên tài sản",
    example: "PC Dell OptiPlex 3080",
  })
  assetName: string;

  @ApiProperty({
    description: "Mã tài sản",
    example: "19-0205/01",
    nullable: true,
  })
  ktCode?: string;

  @ApiProperty({
    description: "Tên phòng",
    example: "A01.03",
    nullable: true,
  })
  roomName?: string;

  @ApiProperty({
    description: "Tên tòa nhà",
    example: "A",
    nullable: true,
  })
  buildingName?: string;

  @ApiProperty({
    description: "Tầng",
    example: "1",
    nullable: true,
  })
  floor?: string;

  @ApiProperty({
    description: "Số máy/label máy",
    example: "01",
    nullable: true,
  })
  machineLabel?: string;

  @ApiProperty({
    description: "Ngày tạo yêu cầu sửa chữa",
    type: "string",
    format: "date-time",
    example: "2025-11-07T10:30:00.000Z",
  })
  createdAt: Date;
}

/**
 * DTO cho filter khi lấy danh sách linh kiện khả dụng từ repair requests
 */
export class AvailableComponentsFilterDto {
  @ApiPropertyOptional({
    description: "Tìm kiếm theo mã yêu cầu sửa chữa (YCSC)",
    example: "YCSC-2025-0002",
  })
  @IsOptional()
  @IsString()
  requestCode?: string;

  @ApiPropertyOptional({
    description: "Lọc theo loại linh kiện",
    enum: ComponentType,
    isArray: true,
    example: [ComponentType.RAM, ComponentType.CPU],
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Chuyển single value thành array
    if (value === undefined || value === null) return value;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsEnum(ComponentType, { each: true })
  @Type(() => String)
  componentType?: ComponentType[];

  @ApiPropertyOptional({
    description: "Tìm kiếm theo tên linh kiện, tài sản, hoặc mã tài sản",
    example: "RAM",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Lọc theo tòa nhà",
    example: "A",
  })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({
    description: "Lọc theo tầng",
    example: "1",
  })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({
    description: "Lọc theo phòng",
    example: "A01.03",
  })
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiPropertyOptional({
    description: "Chỉ lấy linh kiện chưa có trong bất kỳ đề xuất thay thế nào",
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  excludeInProposal?: boolean;

  @ApiPropertyOptional({
    description: "Số trang (từ 1)",
    default: 1,
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @ApiPropertyOptional({
    description: "Số lượng mỗi trang",
    default: 10,
    example: 10,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: "Sắp xếp theo trường",
    default: "createdAt",
    example: "createdAt",
    enum: ["createdAt", "componentName", "requestCode"],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Thứ tự sắp xếp",
    default: "DESC",
    example: "DESC",
    enum: ["ASC", "DESC"],
  })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";
}

