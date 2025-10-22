import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsUUID } from 'class-validator';

export class CreateTechnicianAssignmentDto {
    @IsNotEmpty({ message: 'ID kỹ thuật viên không được để trống' })
    @IsUUID('4', { message: 'ID kỹ thuật viên phải là UUID hợp lệ' })
    @ApiProperty({ description: 'ID kỹ thuật viên' })
    technicianId: string;

    @IsNotEmpty({ message: 'Tên tòa nhà không được để trống' })
    @IsString({ message: 'Tên tòa nhà phải là chuỗi ký tự' })
    @ApiProperty({ description: 'Tên tòa nhà' })
    building: string;

    @IsOptional()
    @IsString({ message: 'Tầng phải là chuỗi ký tự' })
    @ApiProperty({ description: 'Tầng' })
    floor?: string;
}
