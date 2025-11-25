import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as sgMail from '@sendgrid/mail';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);

    constructor(private configService: ConfigService) {
        const sendgridApiKey = this.configService.get<string>('SENDGRID_API_KEY');
        const sendgridEmailFrom = this.configService.get<string>('SENDGRID_EMAIL_FROM');

        // Kiểm tra cấu hình SendGrid
        if (!sendgridApiKey) {
            this.logger.warn('⚠️ SendGrid configuration is missing. Email service will not work properly.');
            this.logger.warn('Please set SENDGRID_API_KEY in your .env file');
        } else {
            sgMail.setApiKey(sendgridApiKey);
            this.logger.log(`✅ Email service initialized with SendGrid (From: ${sendgridEmailFrom || 'not configured'})`);
        }
    }

    /**
     * Gửi email quên mật khẩu
     */
    async sendPasswordResetEmail(
        email: string,
        fullName: string,
        resetToken: string,
    ): Promise<void> {
        const resetUrl = `${this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3003'}/reset-password?token=${resetToken}`;
        const sendgridEmailFrom = this.configService.get<string>('SENDGRID_EMAIL_FROM');
        const sendgridApiKey = this.configService.get<string>('SENDGRID_API_KEY');

        // Kiểm tra cấu hình SendGrid
        if (!sendgridApiKey) {
            this.logger.error('SendGrid configuration is missing. Cannot send email.');
            throw new Error('Cấu hình email chưa được thiết lập. Vui lòng liên hệ quản trị viên.');
        }

        if (!sendgridEmailFrom) {
            this.logger.error('SENDGRID_EMAIL_FROM is missing. Cannot send email.');
            throw new Error('Cấu hình email từ (SENDGRID_EMAIL_FROM) chưa được thiết lập.');
        }

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        line-height: 1.6;
                        color: #333;
                        max-width: 600px;
                        margin: 0 auto;
                        padding: 20px;
                    }
                    .container {
                        background-color: #f9f9f9;
                        border-radius: 8px;
                        padding: 30px;
                        border: 1px solid #e0e0e0;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                    }
                    .header h1 {
                        color: #2563eb;
                        margin: 0;
                    }
                    .content {
                        background-color: white;
                        padding: 20px;
                        border-radius: 5px;
                        margin-bottom: 20px;
                    }
                    .button {
                        display: inline-block;
                        padding: 12px 30px;
                        background-color: #2563eb;
                        color: white;
                        text-decoration: none;
                        border-radius: 5px;
                        margin: 20px 0;
                        font-weight: bold;
                    }
                    .button:hover {
                        background-color: #1d4ed8;
                    }
                    .footer {
                        text-align: center;
                        color: #666;
                        font-size: 12px;
                        margin-top: 30px;
                    }
                    .warning {
                        background-color: #fef3c7;
                        border-left: 4px solid #f59e0b;
                        padding: 15px;
                        margin: 20px 0;
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🔐 Đặt lại mật khẩu</h1>
                    </div>
                    <div class="content">
                        <p>Xin chào <strong>${fullName}</strong>,</p>
                        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
                        <p>Vui lòng nhấp vào nút bên dưới để đặt lại mật khẩu:</p>
                        <div style="text-align: center;">
                            <a href="${resetUrl}" class="button">Đặt lại mật khẩu</a>
                        </div>
                        <p>Hoặc sao chép và dán liên kết sau vào trình duyệt:</p>
                        <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>
                        <div class="warning">
                            <strong>⚠️ Lưu ý:</strong>
                            <ul style="margin: 10px 0; padding-left: 20px;">
                                <li>Liên kết này chỉ có hiệu lực trong <strong>1 giờ</strong></li>
                                <li>Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này</li>
                                <li>Để bảo mật, không chia sẻ liên kết này với bất kỳ ai</li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer">
                        <p>Email này được gửi tự động, vui lòng không trả lời.</p>
                        <p>&copy; ${new Date().getFullYear()} Hệ thống Quản lý Tài sản. Tất cả quyền được bảo lưu.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const msg = {
            to: email,
            from: sendgridEmailFrom,
            subject: 'Đặt lại mật khẩu - Hệ thống Quản lý Tài sản',
            html: htmlContent,
        };

        try {
            await sgMail.send(msg);
            this.logger.log(`✅ Password reset email sent successfully to ${email} via SendGrid`);
        } catch (error) {
            this.logger.error(`❌ Failed to send password reset email to ${email}:`, error);
            
            // Log chi tiết lỗi
            if (error instanceof Error) {
                this.logger.error(`Error message: ${error.message}`);
                if (error.stack) {
                    this.logger.error(`Error stack: ${error.stack}`);
                }
            }
            
            // Trả về message lỗi cụ thể hơn
            let errorMessage = 'Không thể gửi email. Vui lòng thử lại sau.';
            
            if (error instanceof Error) {
                const errorMsg = error.message.toLowerCase();
                const errorResponse = (error as any).response;
                
                // Xử lý các lỗi phổ biến của SendGrid
                if (errorMsg.includes('unauthorized') || errorMsg.includes('forbidden')) {
                    errorMessage = 'Lỗi xác thực SendGrid. Vui lòng kiểm tra SENDGRID_API_KEY trong file .env.';
                } else if (errorMsg.includes('invalid') && errorMsg.includes('email')) {
                    errorMessage = 'Địa chỉ email không hợp lệ.';
                } else if (errorResponse?.body?.errors) {
                    const sendgridErrors = errorResponse.body.errors;
                    errorMessage = `Lỗi SendGrid: ${sendgridErrors.map((e: any) => e.message).join(', ')}`;
                } else if (errorMsg.includes('cấu hình')) {
                    errorMessage = error.message;
                }
            }
            
            throw new Error(errorMessage);
        }
    }
}

