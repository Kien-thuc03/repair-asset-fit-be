import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsNumber, IsEnum, Min, IsArray } from "class-validator";
import { Type, Transform } from "class-transformer";
import { AssetStatus } from "../../../common/shared/AssetStatus";

/**
 * DTO cho response của một máy tính trong danh sách
 * Bao gồm đầy đủ thông tin asset, room, category và components
 */
export class ComputerListItemDto {
  @ApiProperty({
    description: "ID của máy tính",
    example: "9079e621-c74b-4748-98df-281654f82d1e",
  })
  id: string;

  @ApiProperty({
    description: "Số máy/label máy",
    example: "06",
  })
  machineLabel: string;

  @ApiProperty({
    description: "Ghi chú về máy tính",
    example: "Máy tính H.07.05.06",
    nullable: true,
  })
  notes?: string;

  // Asset information
  @ApiProperty({
    description: "Thông tin tài sản",
    type: "object",
    properties: {
      id: { type: "string", description: "ID tài sản" },
      ktCode: { type: "string", description: "Mã kế toán" },
      fixedCode: { type: "string", description: "Mã tài sản cố định" },
      name: { type: "string", description: "Tên tài sản" },
      specs: { type: "string", description: "Thông số kỹ thuật", nullable: true },
      status: { type: "string", enum: Object.values(AssetStatus), description: "Trạng thái" },
      entrydate: { type: "string", format: "date-time", description: "Ngày nhập" },
      origin: { type: "string", description: "Xuất xứ", nullable: true },
      categoryId: { type: "string", description: "ID danh mục" },
      categoryName: { type: "string", description: "Tên danh mục", nullable: true },
    },
    required: ["id", "ktCode", "fixedCode", "name", "status", "entrydate", "categoryId"],
    additionalProperties: false,
  })
  asset: {
    id: string;
    ktCode: string;
    fixedCode: string;
    name: string;
    specs?: string;
    status: AssetStatus;
    entrydate: Date;
    origin?: string;
    categoryId: string;
    categoryName?: string;
  };

  // Room information
  @ApiProperty({
    description: "Thông tin phòng",
    type: "object",
    properties: {
      id: { type: "string", description: "ID phòng" },
      name: { type: "string", description: "Tên phòng" },
      roomNumber: { type: "string", description: "Số phòng" },
      roomCode: { type: "string", description: "Mã phòng" },
      building: { type: "string", description: "Tòa nhà" },
      floor: { type: "string", description: "Tầng" },
    },
    required: ["id", "name", "roomNumber", "roomCode", "building", "floor"],
    additionalProperties: false,
    nullable: true,
  })
  room?: {
    id: string;
    name: string;
    roomNumber: string;
    roomCode: string;
    building: string;
    floor: string;
  };

  // Components summary
  @ApiProperty({
    description: "Danh sách linh kiện",
    type: "array",
    items: {
      type: "object",
      properties: {
        id: { type: "string", description: "ID linh kiện" },
        componentType: { type: "string", description: "Loại linh kiện" },
        name: { type: "string", description: "Tên linh kiện" },
        componentSpecs: { type: "string", description: "Thông số linh kiện", nullable: true },
        serialNumber: { type: "string", description: "Số serial", nullable: true },
        status: { type: "string", description: "Trạng thái" },
        installedAt: { type: "string", format: "date-time", description: "Ngày lắp đặt" },
      },
      required: ["id", "componentType", "name", "status", "installedAt"],
      additionalProperties: false,
    },
  })
  components: Array<{
    id: string;
    componentType: string;
    name: string;
    componentSpecs?: string;
    serialNumber?: string;
    status: string;
    installedAt: Date;
  }>;

  @ApiProperty({
    description: "Số lượng linh kiện",
    example: 10,
  })
  componentCount: number;
}

/**
 * DTO cho filter khi lấy danh sách máy tính
 */
export class GetComputersFilterDto {
  @ApiPropertyOptional({
    description: "Tìm kiếm theo tên, mã KT, mã tài sản cố định",
    example: "Dell OptiPlex",
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: "Lọc theo trạng thái tài sản",
    enum: AssetStatus,
    isArray: true,
    example: [AssetStatus.IN_USE],
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return Array.isArray(value) ? value : [value];
  })
  @IsArray()
  @IsEnum(AssetStatus, { each: true })
  @Type(() => String)
  status?: AssetStatus[];

  @ApiPropertyOptional({
    description: "Lọc theo tòa nhà",
    example: "H",
  })
  @IsOptional()
  @IsString()
  building?: string;

  @ApiPropertyOptional({
    description: "Lọc theo tầng",
    example: "07",
  })
  @IsOptional()
  @IsString()
  floor?: string;

  @ApiPropertyOptional({
    description: "Lọc theo phòng",
    example: "Phòng H.07.05",
  })
  @IsOptional()
  @IsString()
  roomName?: string;

  @ApiPropertyOptional({
    description: "Lọc theo ID phòng",
    example: "ae2a85f0-9f36-488e-a370-20fc0c1d661d",
  })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({
    description: "Lọc theo danh mục",
    example: "Máy tính",
  })
  @IsOptional()
  @IsString()
  categoryName?: string;

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
    default: 12,
    example: 12,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: "Sắp xếp theo trường",
    default: "machineLabel",
    example: "machineLabel",
    enum: ["machineLabel", "assetName", "status", "entrydate", "roomName"],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: "Thứ tự sắp xếp",
    default: "ASC",
    example: "ASC",
    enum: ["ASC", "DESC"],
  })
  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC";
}

/**
 * DTO cho response của danh sách máy tính với pagination
 */
export class GetComputersResponseDto {
  @ApiProperty({
    description: "Trạng thái thành công",
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: "Thông báo",
    example: "Lấy danh sách máy tính thành công",
  })
  message: string;

  @ApiProperty({
    description: "Dữ liệu",
    type: "object",
    properties: {
      computers: {
        type: "array",
        items: { type: "object" },
        description: "Danh sách máy tính",
      },
      pagination: {
        type: "object",
        properties: {
          total: { type: "number", description: "Tổng số bản ghi" },
          page: { type: "number", description: "Trang hiện tại" },
          limit: { type: "number", description: "Số bản ghi mỗi trang" },
          totalPages: { type: "number", description: "Tổng số trang" },
        },
        required: ["total", "page", "limit", "totalPages"],
        additionalProperties: false,
      },
      summary: {
        type: "object",
        properties: {
          totalComputers: { type: "number", description: "Tổng số máy tính" },
          byStatus: { 
            type: "object", 
            description: "Phân bổ theo trạng thái",
            additionalProperties: { type: "number" },
          },
        },
        required: ["totalComputers", "byStatus"],
        additionalProperties: false,
      },
    },
    required: ["computers", "pagination", "summary"],
    additionalProperties: false,
  })
  data: {
    computers: ComputerListItemDto[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
    summary: {
      totalComputers: number;
      byStatus: Record<string, number>;
    };
  };
}

