import { ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsOptional,
  IsString,
  IsUUID,
  IsEnum,
  MaxLength,
} from "class-validator";
import { SoftwareProposalStatus } from "../../../common/shared/SoftwareProposalStatus";

export class UpdateSoftwareProposalDto {
  @ApiPropertyOptional({
    description: "ID phòng máy cần trang bị phần mềm",
    example: "48b11d82-dee9-4003-b34d-d6063cbb230a",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID phòng phải là UUID hợp lệ" })
  roomId?: string;

  @ApiPropertyOptional({
    description: "Lý do cần trang bị phần mềm",
    example:
      "Cập nhật lý do: Phòng máy tính cần thêm phần mềm đồ họa để phục vụ môn Thiết kế đồ họa",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: "Lý do phải là chuỗi ký tự" })
  @MaxLength(1000, { message: "Lý do không được vượt quá 1000 ký tự" })
  reason?: string;

  @ApiPropertyOptional({
    description: "Trạng thái đề xuất",
    enum: SoftwareProposalStatus,
    enumName: "SoftwareProposalStatus",
    example: SoftwareProposalStatus.ĐÃ_DUYỆT,
  })
  @IsOptional()
  @IsEnum(SoftwareProposalStatus, {
    message: `Trạng thái phải là một trong các giá trị: ${Object.values(SoftwareProposalStatus).join(", ")}`,
  })
  status?: SoftwareProposalStatus;

  @ApiPropertyOptional({
    description: "ID người duyệt đề xuất",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID người duyệt phải là UUID hợp lệ" })
  approverId?: string;
}
