import { IsOptional, IsString } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export class QueryTechnicianAssignmentDto {
  @IsOptional()
  @IsString({ message: "Tên tòa nhà phải là chuỗi ký tự" })
  @ApiPropertyOptional({ description: "Tên tòa nhà để lọc" })
  building?: string;

  @IsOptional()
  @IsString({ message: "Tầng phải là chuỗi ký tự" })
  @ApiPropertyOptional({ description: "Tầng để lọc" })
  floor?: string;
}
