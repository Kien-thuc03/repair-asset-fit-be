import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class ForgotPasswordDto {
    @ApiProperty({
        example: 'john_doe',
        description: 'Tên đăng nhập của người dùng'
    })
    @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
    @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
    @MinLength(3, { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' })
    @MaxLength(50, { message: 'Tên đăng nhập không được vượt quá 50 ký tự' })
    @Matches(/^[a-zA-Z0-9_]+$/, {
        message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới'
    })
    username: string;
}

