import { IsOptional, IsString, IsUUID } from 'class-validator';

export class QueryTechnicianAssignmentDto {
    @IsOptional()
    @IsUUID('4', { message: 'ID kỹ thuật viên phải là UUID hợp lệ' })
    technicianId?: string;

    @IsOptional()
    @IsString({ message: 'Tên tòa nhà phải là chuỗi ký tự' })
    building?: string;

    @IsOptional()
    @IsString({ message: 'Tầng phải là chuỗi ký tự' })
    floor?: string;
}
