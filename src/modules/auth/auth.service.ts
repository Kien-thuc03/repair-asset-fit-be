import { BadRequestException, Injectable, Logger, UnauthorizedException, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import { User, UserStatus } from "src/entities/user.entity";
import { errorResponse } from "src/common/helpers/error-response";
import * as bcrypt from "bcryptjs";
import { JwtPayload } from "./interfaces/jwt-payload.interface";
import { LoginDto } from "./dtos/login.dto";
import { ChangePasswordDto } from "./dtos/change-password.dto";
import { UserProfileResponseDto } from "./dtos/user-profile-response.dto";
import { UpdateProfileDto } from "./dtos/user-profile.dto";
import { UserLoginResponse } from "./dtos/user-login-response.dto";
import { ForgotPasswordDto } from "./dtos/forgot-password.dto";
import { ResetPasswordDto } from "./dtos/reset-password.dto";
import { EmailService } from "../email/email.service";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly jwtService: JwtService,
        private readonly logger: Logger,
        private readonly emailService: EmailService,
    ) { }
    async login(
        loginDto: LoginDto,
    ): Promise<{ user: Omit<UserLoginResponse, 'password'>; token: string }> {
        try {
            const { username, password } = loginDto;

            const user = await this.validateUser(username, password);
            if (!user) {
                throw new UnauthorizedException(errorResponse('INVALID_CREDENTIALS', 'Invalid credentials'));
            }

            const roles = user.roles.map(role => role.code);
            const permissions = user.roles.flatMap(role => role.permissions?.map(p => p.code) ?? []);

            // Generate JWT token
            const payload: JwtPayload = {
                sub: user.id,
                email: user.email,
                roles: roles,
                fullName: user.fullName,
                permissions: permissions,
            };

            const token = this.jwtService.sign(payload);
            const userLogin: UserLoginResponse = {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                roles: roles,
                permissions: permissions,
                email: user.email,
                phoneNumber: user.phoneNumber,
                birthDate: user.birthDate
            }
        
            return { user: userLogin, token };
        } catch (e) {
            this.logger.error(e, 'Login error:');
            throw e;
        }
    }

    async validateUser(username: string, password: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { username, status: UserStatus.ACTIVE },
            relations: ['roles', 'roles.permissions', 'unit'],
        });
        if (user && (await bcrypt.compare(password, user.password))) {
            return user;
        }
        return null;
    }

    async findUserById(sub: string): Promise<User> {
        const user = await this.userRepository.findOne({
            where: { id: sub, status: UserStatus.ACTIVE },
            relations: ['roles', 'roles.permissions'],
        });
        if (!user) {
            throw new UnauthorizedException(
                errorResponse("NOT_FOUND", "User not found or inactive")
            );
        }
        return user;
    }

    /**
     * Change user password
     * @description Change user password based on the provided ChangePasswordDto.
     * @param changePasswordDto Data Transfer Object containing username, current password, new password, and confirm password
     * @param currentUser 
     * @returns A message indicating the result of the password change operation
     */
    async changePassword(
        changePasswordDto: ChangePasswordDto,
        currentUser?: User
    ): Promise<{ message: string }> {

        if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
            throw new BadRequestException(
                errorResponse("PASSWORD_MISMATCH", "New password and confirm password do not match")
            );
        }

        if(!currentUser?.id) {
            throw new UnauthorizedException(
                errorResponse("UNAUTHORIZED", "User not authenticated")
            );
        }

        let user = await this.userRepository.findOne({
            where: { id: currentUser.id, status: UserStatus.ACTIVE },
        });

        if (!user) {
            throw new UnauthorizedException(
                errorResponse("NOT_FOUND", "User not found or inactive")
            );
        }

        const isMatch = await bcrypt.compare(changePasswordDto.currentPassword, user.password);
        if (!isMatch) {
            throw new UnauthorizedException(
                errorResponse("INVALID_CREDENTIALS", "Invalid current password")
            );
        }

        user.password = await bcrypt.hash(changePasswordDto.newPassword, 12);
        await this.userRepository.save(user);

        return { message: 'Password changed successfully' };
    }

    /**
     * Update user profile
     * @description Update user profile based on the provided UpdateProfileDto.
     * @param updateProfileDto Data to update user profile
     * @param currentUser 
     * @returns 
     */
    async updateProfile(
        updateProfileDto: UpdateProfileDto,
        currentUser?: User
    ): Promise<UserProfileResponseDto> {
        if(!currentUser?.id) {
            throw new UnauthorizedException(
                errorResponse("UNAUTHORIZED", "User not authenticated")
            );
        }

        let user = await this.userRepository.findOne({
            where: { id: currentUser.id, status: UserStatus.ACTIVE },
        });

        if (!user) {
            throw new UnauthorizedException(
                errorResponse("NOT_FOUND", "User not found or inactive")
            );
        }

        user.fullName = updateProfileDto.fullName;
        user.email = updateProfileDto.email;
        user.phoneNumber = updateProfileDto.phoneNumber;
        user.birthDate = updateProfileDto.birthDate;

        user = await this.userRepository.save(user);

        return {
            fullName: user.fullName,
            email: user.email,
            phoneNumber: user.phoneNumber,
            birthDate: user.birthDate,
        };
    }

    /**
     * Quên mật khẩu - Gửi email reset password
     * @description Tạo JWT token reset password và gửi email cho user
     * @param forgotPasswordDto DTO chứa username của user
     * @returns Message xác nhận đã gửi email
     */
    async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
        const { username } = forgotPasswordDto;

        const user = await this.userRepository.findOne({
            where: { username, status: UserStatus.ACTIVE },
        });

        // Không tiết lộ thông tin nếu username không tồn tại (security best practice)
        if (!user) {
            // Vẫn trả về success message để không tiết lộ username có tồn tại hay không
            this.logger.warn(`Forgot password request for non-existent username: ${username}`);
            return { message: 'Nếu tên đăng nhập tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu đến email đăng ký của bạn.' };
        }

        // Kiểm tra user có email không
        if (!user.email) {
            this.logger.warn(`User ${username} does not have email configured`);
            throw new BadRequestException(
                errorResponse("NO_EMAIL", "Tài khoản này chưa có email đăng ký. Vui lòng liên hệ quản trị viên.")
            );
        }

        // Tạo JWT token cho reset password (giống như login token)
        // Payload chỉ chứa userId và type để phân biệt với login token
        const resetTokenPayload = {
            sub: user.id,
            email: user.email,
            type: 'reset_password', // Đánh dấu đây là token reset password
        };

        // Tạo JWT token với thời gian hết hạn 1 giờ
        const resetToken = this.jwtService.sign(resetTokenPayload, {
            expiresIn: '1h', // Token hết hạn sau 1 giờ
        });

        // Gửi email
        try {
            await this.emailService.sendPasswordResetEmail(user.email, user.fullName, resetToken);
            this.logger.log(`Password reset email sent to ${user.email} for username: ${username}`);
        } catch (error) {
            this.logger.error('Failed to send password reset email:', error);
            
            // Lấy message từ error nếu có
            const errorMessage = error instanceof Error 
                ? error.message 
                : "Không thể gửi email. Vui lòng thử lại sau.";
            
            throw new BadRequestException(
                errorResponse("EMAIL_SEND_FAILED", errorMessage)
            );
        }

        return { message: 'Nếu tên đăng nhập tồn tại, chúng tôi đã gửi liên kết đặt lại mật khẩu đến email đăng ký của bạn.' };
    }

    /**
     * Đặt lại mật khẩu với token
     * @description Đặt lại mật khẩu mới cho user dựa trên JWT token từ email
     * @param resetPasswordDto DTO chứa token, mật khẩu mới và xác nhận mật khẩu
     * @returns Message xác nhận đã đặt lại mật khẩu thành công
     */
    async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
        const { token, newPassword, confirmPassword } = resetPasswordDto;

        // Validate password match
        if (newPassword !== confirmPassword) {
            throw new BadRequestException(
                errorResponse("PASSWORD_MISMATCH", "Mật khẩu mới và xác nhận mật khẩu không khớp")
            );
        }

        // Verify và decode JWT token
        let decodedToken: any;
        try {
            decodedToken = this.jwtService.verify(token);
        } catch (error) {
            // Token không hợp lệ hoặc đã hết hạn
            throw new UnauthorizedException(
                errorResponse("INVALID_TOKEN", "Token không hợp lệ hoặc đã hết hạn")
            );
        }

        // Kiểm tra token có phải là reset password token không
        if (decodedToken.type !== 'reset_password') {
            throw new UnauthorizedException(
                errorResponse("INVALID_TOKEN_TYPE", "Token không phải là token đặt lại mật khẩu")
            );
        }

        // Lấy userId từ token payload
        const userId = decodedToken.sub;
        if (!userId) {
            throw new UnauthorizedException(
                errorResponse("INVALID_TOKEN", "Token không chứa thông tin người dùng")
            );
        }

        // Tìm user với ID từ token
        const user = await this.userRepository.findOne({
            where: {
                id: userId,
                status: UserStatus.ACTIVE,
            },
        });

        if (!user) {
            throw new NotFoundException(
                errorResponse("USER_NOT_FOUND", "Người dùng không tồn tại hoặc đã bị vô hiệu hóa")
            );
        }

        // Hash và lưu mật khẩu mới
        user.password = await bcrypt.hash(newPassword, 12);
        await this.userRepository.save(user);

        this.logger.log(`Password reset successful for user: ${user.email}`);

        return { message: 'Đặt lại mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.' };
    }
}