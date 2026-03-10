import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsArray,
  ValidateNested,
  ArrayMinSize,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { CreateSoftwareProposalItemDto } from "./create-software-proposal-item.dto";

export class CreateSoftwareProposalDto {
  @ApiProperty({
    description: "ID phòng máy cần trang bị phần mềm",
    example: "48b11d82-dee9-4003-b34d-d6063cbb230a",
    format: "uuid",
  })
  @IsUUID(4, { message: "ID phòng phải là UUID hợp lệ" })
  @IsNotEmpty({ message: "ID phòng không được để trống" })
  roomId: string;

  @ApiProperty({
    description: "Lý do cần trang bị phần mềm",
    example:
      "Phòng máy tính cần cài đặt Microsoft Office để phục vụ giảng dạy môn Tin học văn phòng cho sinh viên năm nhất",
    maxLength: 1000,
  })
  @IsString({ message: "Lý do phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Lý do không được để trống" })
  @MaxLength(1000, { message: "Lý do không được vượt quá 1000 ký tự" })
  reason: string;

  @ApiProperty({
    description: "Danh sách phần mềm cần đề xuất",
    type: [CreateSoftwareProposalItemDto],
    minItems: 1,
  })
  @IsArray({ message: "Danh sách phần mềm phải là một mảng" })
  @ArrayMinSize(1, { message: "Phải có ít nhất một phần mềm trong đề xuất" })
  @ValidateNested({ each: true })
  @Type(() => CreateSoftwareProposalItemDto)
  items: CreateSoftwareProposalItemDto[];
}
