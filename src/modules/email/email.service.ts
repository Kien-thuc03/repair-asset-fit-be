import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private configService: ConfigService) {
        const smtpHost = this.configService.get<string>('SMTP_HOST') || 'smtp.gmail.com';
        const smtpPort = parseInt(this.configService.get<string>('SMTP_PORT') || '587');
        const smtpUser = this.configService.get<string>('SMTP_USER');
        const smtpPass = this.configService.get<string>('SMTP_PASS');

        // Kiểm tra cấu hình SMTP
        if (!smtpUser || !smtpPass) {
            this.logger.warn('⚠️ SMTP configuration is missing. Email service will not work properly.');
            this.logger.warn('Please set SMTP_USER and SMTP_PASS in your .env file');
        }

        this.transporter = nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: false, // true for 465, false for other ports
            auth: smtpUser && smtpPass ? {
                user: smtpUser,
                pass: smtpPass,
            } : undefined,
            connectionTimeout: 10000, // 10 seconds
            greetingTimeout: 5000, // 5 seconds
            socketTimeout: 10000, // 10 seconds
            pool: true, // Use connection pooling
            maxConnections: 1,
            maxMessages: 3,
        });

        this.logger.log(`Email service initialized with host: ${smtpHost}:${smtpPort}`);
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
        const smtpUser = this.configService.get<string>('SMTP_USER');

        const mailOptions = {
            from: `"Hệ thống Quản lý Tài sản" <${smtpUser}>`,
            to: email,
            subject: 'Đặt lại mật khẩu - Hệ thống Quản lý Tài sản',
            html: `
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
            `,
        };

        try {
            // Kiểm tra cấu hình SMTP trước khi gửi
            const smtpUser = this.configService.get<string>('SMTP_USER');
            const smtpPass = this.configService.get<string>('SMTP_PASS');
            
            if (!smtpUser || !smtpPass) {
                this.logger.error('SMTP configuration is missing. Cannot send email.');
                throw new Error('Cấu hình email chưa được thiết lập. Vui lòng liên hệ quản trị viên.');
            }

            // Verify connection trước khi gửi (với timeout)
            try {
                await Promise.race([
                    this.transporter.verify(),
                    new Promise((_, reject) => 
                        setTimeout(() => reject(new Error('Connection verification timeout')), 8000)
                    )
                ]);
                this.logger.log('✅ SMTP connection verified');
            } catch (verifyError) {
                this.logger.warn('⚠️ SMTP verification failed, but attempting to send email anyway:', verifyError);
                // Tiếp tục gửi email dù verify fail (một số SMTP server không hỗ trợ verify)
            }

            await this.transporter.sendMail(mailOptions);
            this.logger.log(`✅ Password reset email sent successfully to ${email}`);
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
                const errorCode = (error as any).code?.toLowerCase() || '';
                
                // Xử lý các lỗi phổ biến
                if (errorMsg.includes('authentication') || errorMsg.includes('invalid login') || 
                    errorCode.includes('eauth') || errorCode.includes('eauthentication')) {
                    errorMessage = 'Lỗi xác thực email. Vui lòng kiểm tra SMTP_USER và SMTP_PASS trong file .env. Đối với Gmail, bạn cần sử dụng App Password.';
                } else if (errorMsg.includes('connection') || errorMsg.includes('timeout') || 
                           errorCode.includes('econnrefused') || errorCode.includes('etimedout')) {
                    errorMessage = 'Không thể kết nối đến máy chủ email. Vui lòng kiểm tra SMTP_HOST và SMTP_PORT.';
                } else if (errorMsg.includes('cấu hình')) {
                    errorMessage = error.message;
                } else if (errorCode.includes('econnreset')) {
                    errorMessage = 'Kết nối bị ngắt. Vui lòng kiểm tra firewall hoặc cấu hình mạng.';
                }
            }
            
            throw new Error(errorMessage);
        }
    }
}

