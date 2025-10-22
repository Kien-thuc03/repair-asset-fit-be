import { ApiProperty } from "@nestjs/swagger";
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  Min,
  MaxLength,
  IsUUID,
} from "class-validator";

export class CreateSoftwareProposalItemDto {
  @ApiProperty({
    description: "Tên phần mềm cần mua",
    example: "Microsoft Office 2021 Professional Plus",
    maxLength: 255,
  })
  @IsString({ message: "Tên phần mềm phải là chuỗi ký tự" })
  @IsNotEmpty({ message: "Tên phần mềm không được để trống" })
  @MaxLength(255, { message: "Tên phần mềm không được vượt quá 255 ký tự" })
  softwareName: string;

  @ApiProperty({
    description: "Phiên bản phần mềm",
    example: "2021",
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: "Phiên bản phải là chuỗi ký tự" })
  @MaxLength(100, { message: "Phiên bản không được vượt quá 100 ký tự" })
  version?: string;

  @ApiProperty({
    description: "Nhà sản xuất/phát hành phần mềm",
    example: "Microsoft Corporation",
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: "Nhà sản xuất phải là chuỗi ký tự" })
  @MaxLength(255, { message: "Nhà sản xuất không được vượt quá 255 ký tự" })
  publisher?: string;

  @ApiProperty({
    description: "Số lượng license cần mua",
    example: 30,
    minimum: 1,
    default: 1,
  })
  @IsInt({ message: "Số lượng phải là số nguyên" })
  @Min(1, { message: "Số lượng phải ít nhất là 1" })
  quantity: number = 1;

  @ApiProperty({
    description: "Loại giấy phép",
    example: "Vĩnh viễn",
    required: false,
    maxLength: 100,
  })
  @IsOptional()
  @IsString({ message: "Loại giấy phép phải là chuỗi ký tự" })
  @MaxLength(100, { message: "Loại giấy phép không được vượt quá 100 ký tự" })
  licenseType?: string;

  @ApiProperty({
    description:
      "ID phần mềm trong hệ thống sau khi được thêm vào (chỉ dành cho cập nhật)",
    required: false,
    format: "uuid",
  })
  @IsOptional()
  @IsUUID(4, { message: "ID phần mềm phải là UUID hợp lệ" })
  newlyAcquiredSoftwareId?: string;
}
