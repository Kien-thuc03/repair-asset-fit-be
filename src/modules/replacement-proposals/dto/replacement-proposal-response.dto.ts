import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ReplacementStatus } from "../../../common/shared/ReplacementStatus";

export class ReplacementItemResponseDto {
  @ApiProperty({ description: "ID của item" })
  id: string;

  @ApiProperty({ description: "ID đề xuất" })
  proposalId: string;

  @ApiPropertyOptional({ description: "ID linh kiện cũ" })
  oldComponentId?: string;

  @ApiPropertyOptional({
    description: "Thông tin linh kiện cũ",
    type: "object",
    properties: {
      id: { type: "string" },
      componentType: { type: "string" },
      name: { type: "string" },
      componentSpecs: { type: "string" },
      status: { type: "string" },
      roomLocation: { type: "string" },
    },
  })
  oldComponent?: {
    id: string;
    componentType: string;
    name: string;
    componentSpecs?: string;
    status: string;
    roomLocation?: string;
  };

  @ApiProperty({ description: "Tên linh kiện/thiết bị mới" })
  newItemName: string;

  @ApiPropertyOptional({ description: "Thông số kỹ thuật chi tiết" })
  newItemSpecs?: string;

  @ApiProperty({ description: "Số lượng", default: 1 })
  quantity: number;

  @ApiPropertyOptional({ description: "Lý do thay thế" })
  reason?: string;

  @ApiPropertyOptional({ description: "ID linh kiện mới đã mua" })
  newlyPurchasedComponentId?: string;

  @ApiPropertyOptional({
    description: "Thông tin linh kiện mới đã mua",
    type: "object",
    properties: {
      id: { type: "string" },
      componentType: { type: "string" },
      name: { type: "string" },
      componentSpecs: { type: "string" },
    },
  })
  newlyPurchasedComponent?: {
    id: string;
    componentType: string;
    name: string;
    componentSpecs?: string;
  };
}

export class ReplacementProposalResponseDto {
  @ApiProperty({ description: "ID của đề xuất" })
  id: string;

  @ApiPropertyOptional({ description: "Tiêu đề đề xuất" })
  title?: string;

  @ApiPropertyOptional({ description: "Mô tả đề xuất" })
  description?: string;

  @ApiProperty({ description: "Mã đề xuất" })
  proposalCode: string;

  @ApiProperty({ description: "ID người đề xuất" })
  proposerId: string;

  @ApiPropertyOptional({
    description: "Thông tin người đề xuất",
    type: "object",
    properties: {
      id: { type: "string" },
      username: { type: "string" },
      fullName: { type: "string" },
      email: { type: "string" },
    },
  })
  proposer?: {
    id: string;
    username: string;
    fullName: string;
    email?: string;
  };

  @ApiPropertyOptional({ description: "ID tổ trưởng kỹ thuật duyệt" })
  teamLeadApproverId?: string;

  @ApiPropertyOptional({
    description: "Thông tin tổ trưởng kỹ thuật",
    type: "object",
    properties: {
      id: { type: "string" },
      username: { type: "string" },
      fullName: { type: "string" },
      email: { type: "string" },
    },
  })
  teamLeadApprover?: {
    id: string;
    username: string;
    fullName: string;
    email?: string;
  };

  @ApiPropertyOptional({ description: "ID admin xác minh" })
  adminVerifierId?: string;

  @ApiPropertyOptional({
    description: "Thông tin admin xác minh",
    type: "object",
    properties: {
      id: { type: "string" },
      username: { type: "string" },
      fullName: { type: "string" },
      email: { type: "string" },
    },
  })
  adminVerifier?: {
    id: string;
    username: string;
    fullName: string;
    email?: string;
  };

  @ApiProperty({
    description: "Trạng thái đề xuất",
    enum: ReplacementStatus,
  })
  status: ReplacementStatus;

  @ApiPropertyOptional({ description: "URL file tờ trình" })
  submissionFormUrl?: string;

  @ApiPropertyOptional({ description: "URL file biên bản xác minh" })
  verificationReportUrl?: string;

  @ApiProperty({ description: "Ngày tạo" })
  createdAt: Date;

  @ApiProperty({ description: "Ngày cập nhật" })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: "Danh sách items cần thay thế",
    type: [ReplacementItemResponseDto],
  })
  items?: ReplacementItemResponseDto[];

  @ApiPropertyOptional({
    description: "Số lượng items",
    type: "number",
  })
  itemsCount?: number;
}
