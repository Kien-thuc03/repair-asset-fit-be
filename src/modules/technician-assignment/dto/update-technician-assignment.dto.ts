import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class UpdateTechnicianAssignmentDto {
  @IsNotEmpty({ message: "Building không được để trống" })
  @IsString({ message: "Building phải là chuỗi" })
  @ApiProperty({ description: "Tên tòa nhà" })
  building: string;

  @IsNotEmpty({ message: "Floor không được để trống" })
  @IsString({ message: "Floor phải là chuỗi" })
  @ApiProperty({ description: "Tên tầng" })
  floor: string;

  @IsNotEmpty({ message: "ID kỹ thuật viên không được để trống" })
  @IsUUID("4", { message: "ID kỹ thuật viên phải là UUID hợp lệ" })
  @ApiProperty({ description: "ID kỹ thuật viên mới" })
  technicianId: string;
}
