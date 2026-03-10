import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, Matches, MinLength } from "class-validator";

export class ResetPasswordDto {
    @ApiProperty({
        example: 'reset-token-here',
        description: 'Token để đặt lại mật khẩu'
    })
    @IsString()
    @IsNotEmpty({ message: 'Token không được để trống' })
    token: string;

    @ApiProperty({
        example: 'NewPassword123!',
        description: 'Mật khẩu mới - Tối thiểu 8 ký tự với chữ hoa, chữ thường, số và ký tự đặc biệt',
        minLength: 8,
        pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[!@#$%^&*]).{8,}$'
    })
    @IsString()
    @IsNotEmpty()
    @MinLength(8, { message: 'Mật khẩu mới phải có ít nhất 8 ký tự' })
    @Matches(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/,
        {
            message: 'Mật khẩu mới phải chứa ít nhất: 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số và 1 ký tự đặc biệt (!@#$%^&*)'
        }
    )
    newPassword: string;

    @ApiProperty({
        example: 'NewPassword123!',
        description: 'Xác nhận mật khẩu mới'
    })
    @IsString()
    @IsNotEmpty()
    confirmPassword: string;
}

