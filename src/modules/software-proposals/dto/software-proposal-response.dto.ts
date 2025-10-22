import { Expose, Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { SoftwareProposalStatus } from "../../../common/shared/SoftwareProposalStatus";

class ProposerInfoDto {
  @Expose()
  @ApiProperty({ description: "ID người tạo đề xuất" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Họ tên người tạo đề xuất" })
  fullName: string;

  @Expose()
  @ApiProperty({ description: "Email người tạo đề xuất" })
  email: string;

  @Expose()
  @ApiProperty({ description: "Tên đơn vị" })
  unitName: string;
}

class ApproverInfoDto {
  @Expose()
  @ApiProperty({ description: "ID người duyệt đề xuất" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Họ tên người duyệt đề xuất" })
  fullName: string;

  @Expose()
  @ApiProperty({ description: "Email người duyệt đề xuất" })
  email: string;

  @Expose()
  @ApiProperty({ description: "Tên đơn vị" })
  unitName: string;
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

class SoftwareProposalItemResponseDto {
  @Expose()
  @ApiProperty({ description: "ID của item" })
  id: string;

  @Expose()
  @ApiProperty({ description: "Tên phần mềm cần mua" })
  softwareName: string;

  @Expose()
  @ApiPropertyOptional({ description: "Phiên bản phần mềm" })
  version?: string;

  @Expose()
  @ApiPropertyOptional({ description: "Nhà sản xuất" })
  publisher?: string;

  @Expose()
  @ApiProperty({ description: "Số lượng license cần mua" })
  quantity: number;

  @Expose()
  @ApiPropertyOptional({ description: "Loại giấy phép" })
  licenseType?: string;

  @Expose()
  @ApiPropertyOptional({
    description: "ID phần mềm sau khi được thêm vào hệ thống",
  })
  newlyAcquiredSoftwareId?: string;
}

export class SoftwareProposalResponseDto {
  @Expose()
  @ApiProperty({
    description: "ID của đề xuất",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  id: string;

  @Expose()
  @ApiProperty({
    description: "Mã đề xuất",
    example: "DXPM-2025-0001",
  })
  proposalCode: string;

  @Expose()
  @ApiProperty({
    description: "ID người tạo đề xuất",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  proposerId: string;

  @Expose()
  @ApiPropertyOptional({
    description: "ID người duyệt đề xuất",
    example: "123e4567-e89b-12d3-a456-426614174002",
  })
  approverId?: string;

  @Expose()
  @ApiProperty({
    description: "ID phòng máy cần trang bị phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174003",
  })
  roomId: string;

  @Expose()
  @ApiProperty({
    description: "Lý do cần trang bị phần mềm",
    example: "Phòng máy tính cần Microsoft Office để phục vụ giảng dạy",
  })
  reason: string;

  @Expose()
  @ApiProperty({
    description: "Trạng thái đề xuất",
    enum: SoftwareProposalStatus,
    example: SoftwareProposalStatus.CHỜ_DUYỆT,
  })
  status: SoftwareProposalStatus;

  @Expose()
  @ApiProperty({
    description: "Ngày tạo đề xuất",
    example: "2025-01-15T10:30:00Z",
  })
  createdAt: Date;

  @Expose()
  @ApiProperty({
    description: "Ngày cập nhật gần nhất",
    example: "2025-01-16T14:20:00Z",
  })
  updatedAt: Date;

  @Expose()
  @Type(() => ProposerInfoDto)
  @ApiPropertyOptional({
    description: "Thông tin người tạo đề xuất",
    type: ProposerInfoDto,
  })
  proposer?: ProposerInfoDto;

  @Expose()
  @Type(() => ApproverInfoDto)
  @ApiPropertyOptional({
    description: "Thông tin người duyệt đề xuất",
    type: ApproverInfoDto,
  })
  approver?: ApproverInfoDto;

  @Expose()
  @Type(() => RoomInfoDto)
  @ApiPropertyOptional({
    description: "Thông tin phòng máy",
    type: RoomInfoDto,
  })
  room?: RoomInfoDto;

  @Expose()
  @Type(() => SoftwareProposalItemResponseDto)
  @ApiPropertyOptional({
    description: "Danh sách phần mềm trong đề xuất",
    type: [SoftwareProposalItemResponseDto],
  })
  items?: SoftwareProposalItemResponseDto[];
}
