import {
  IsString,
  IsOptional,
  IsDateString,
  IsUUID,
  IsNotEmpty,
  MaxLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateAssetSoftwareDto {
  @ApiProperty({
    description: `ID của tài sản (máy tính) cần cài đặt phần mềm.
    
    🔍 **Cách lấy Asset ID:**
    1. Gọi GET /api/v1/assets để lấy danh sách tài sản
    2. Chọn tài sản có shape = 'COMPUTER'
    3. Copy giá trị 'id' của tài sản đó
    
    📋 **Dữ liệu mẫu có sẵn:** "Máy vi tính Vostro 270MT"`,
    example: "48b11d82-dee9-4003-b34d-d6063cbb230a",
    format: "uuid",
  })
  @IsNotEmpty({ message: "ID tài sản không được để trống" })
  @IsUUID("all", { message: "ID tài sản phải là UUID hợp lệ" })
  assetId: string;

  @ApiProperty({
    description: `ID của phần mềm cần cài đặt.
    
    🔍 **Cách lấy Software ID:**
    1. Gọi GET /api/v1/software để lấy danh sách phần mềm
    2. Chọn phần mềm muốn cài đặt
    3. Copy giá trị 'id' của phần mềm đó
    
    📋 **Các phần mềm mẫu có sẵn:**
    - Microsoft Office 2021
    - Visual Studio Code 
    - AutoCAD 2024`,
    example: "d52a67b3-155f-4d30-8134-94de8fecf657",
    format: "uuid",
  })
  @IsNotEmpty({ message: "ID phần mềm không được để trống" })
  @IsUUID("all", { message: "ID phần mềm phải là UUID hợp lệ" })
  softwareId: string;

  @ApiPropertyOptional({
    description: `Ngày cài đặt phần mềm (tùy chọn).
    
    📅 **Lưu ý:**
    - Nếu không điền, hệ thống sẽ tự động lấy ngày hiện tại
    - Định dạng: YYYY-MM-DD
    - Có thể là ngày trong quá khứ (đã cài đặt trước đó)
    
    💡 **Gợi ý:** Để trống nếu đang cài đặt ngay bây giờ`,
    example: "2024-01-15",
    format: "date",
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: "Ngày cài đặt phải có định dạng hợp lệ (YYYY-MM-DD)" }
  )
  installationDate?: string;

  @ApiPropertyOptional({
    description: `Ghi chú về việc cài đặt (tùy chọn).
    
    📝 **Có thể bao gồm:**
    - License key/Serial number
    - Thông tin cấu hình đặc biệt
    - Phiên bản cài đặt cụ thể
    - Lưu ý về tương thích
    
    💡 **Ví dụ thực tế:**
    - "License key: ABC123-DEF456-GHI789"
    - "Cài đặt bản Enterprise với SQL Server"
    - "Cấu hình cho phòng thí nghiệm, license giáo dục"`,
    example:
      "License key: ABCD-EFGH-IJKL-MNOP. Cài đặt với quyền admin cho phòng Lab.",
    maxLength: 1000,
  })
  @IsOptional()
  @IsString({ message: "Ghi chú phải là chuỗi" })
  @MaxLength(1000, { message: "Ghi chú không được vượt quá 1000 ký tự" })
  notes?: string;
}
