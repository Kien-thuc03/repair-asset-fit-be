import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { ReplacementStatus } from "../../../common/shared/ReplacementStatus";

export class UpdateReplacementProposalStatusDto {
  @ApiProperty({
    description: "Trạng thái mới",
    enum: ReplacementStatus,
    example: ReplacementStatus.ĐÃ_DUYỆT,
  })
  @IsEnum(ReplacementStatus)
  status: ReplacementStatus;

  @ApiPropertyOptional({
    description: "ID tổ trưởng kỹ thuật (tự động set khi duyệt/từ chối)",
  })
  @IsOptional()
  @IsUUID()
  teamLeadApproverId?: string;

  @ApiPropertyOptional({
    description: "ID admin xác minh (tự động set khi xác minh)",
  })
  @IsOptional()
  @IsUUID()
  adminVerifierId?: string;

  @ApiPropertyOptional({ description: "URL file tờ trình" })
  @IsOptional()
  @IsString()
  submissionFormUrl?: string;

  @ApiPropertyOptional({ description: "URL file biên bản xác minh" })
  @IsOptional()
  @IsString()
  verificationReportUrl?: string;
}
