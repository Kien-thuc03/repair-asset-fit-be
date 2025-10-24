import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
  IsEnum,
} from 'class-validator';
import { CreateRepairRequestDto } from './create-repair-request.dto';
import { RepairStatus } from 'src/common/shared/RepairStatus';

/**
 * DTO cho endpoint ghi nhận và xử lý lỗi trực tiếp tại hiện trường
 * Dành cho kỹ thuật viên có thể tạo repair request VÀ cập nhật kết quả xử lý trong 1 lần
 */
export class CreateAndProcessRepairRequestDto extends CreateRepairRequestDto {
  @ApiPropertyOptional({
    description: `Ghi chú chi tiết quá trình xử lý lỗi.
    
    - Đối với lỗi phần mềm (errorType = MAY_HU_PHAN_MEM): Mô tả các bước sửa chữa (cài đặt lại, update driver, kill virus, etc.)
    - Đối với lỗi phần cứng: Mô tả cách sửa chữa (thay cáp, làm sạch tiếp xúc, etc.) hoặc lý do cần thay thế
    
    Field này là BẮT BUỘC khi muốn cập nhật trạng thái sang ĐÃ_HOÀN_THÀNH hoặc CHỜ_THAY_THẾ`,
    example:
      'Đã kiểm tra và cài đặt lại Windows 10. Cập nhật driver card màn hình. Cài đặt phần mềm Office 2021. Máy hoạt động bình thường.',
    maxLength: 2000,
  })
  @IsOptional()
  @IsString({ message: 'Ghi chú xử lý phải là chuỗi ký tự' })
  @MaxLength(2000, {
    message: 'Ghi chú xử lý không được vượt quá 2000 ký tự',
  })
  resolutionNotes?: string;

  @ApiPropertyOptional({
    description: `Trạng thái cuối cùng sau khi xử lý lỗi.
    
    Các trạng thái cho phép:
    - ĐÃ_HOÀN_THÀNH: Lỗi đã được sửa chữa thành công (áp dụng cho cả lỗi phần mềm và phần cứng)
    - CHỜ_THAY_THẾ: Linh kiện hỏng không thể sửa chữa, cần thay thế mới (chỉ áp dụng cho lỗi phần cứng)
    
    Nếu không cung cấp, repair request sẽ được tạo với status mặc định CHỜ_TIẾP_NHẬN (chờ xử lý sau)`,
    enum: [RepairStatus.ĐÃ_HOÀN_THÀNH, RepairStatus.CHỜ_THAY_THẾ],
    example: RepairStatus.ĐÃ_HOÀN_THÀNH,
  })
  @IsOptional()
  @IsEnum([RepairStatus.ĐÃ_HOÀN_THÀNH, RepairStatus.CHỜ_THAY_THẾ], {
    message:
      'Trạng thái cuối cùng chỉ có thể là ĐÃ_HOÀN_THÀNH hoặc CHỜ_THAY_THẾ',
  })
  finalStatus?: RepairStatus.ĐÃ_HOÀN_THÀNH | RepairStatus.CHỜ_THAY_THẾ;
}
