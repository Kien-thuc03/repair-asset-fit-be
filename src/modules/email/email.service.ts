import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as sgMail from "@sendgrid/mail";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    const sendGridApiKey = this.configService.get<string>("SENDGRID_API_KEY");
    this.fromEmail = this.configService.get<string>("SENDGRID_EMAIL_FROM");

    // Kiểm tra cấu hình SendGrid
    if (!sendGridApiKey) {
      this.logger.warn(
        "⚠️ SendGrid API key is missing. Email service will not work properly."
      );
      this.logger.warn("Please set SENDGRID_API_KEY in your .env file");
    } else {
      // Khởi tạo SendGrid
      sgMail.setApiKey(sendGridApiKey);
      this.logger.log("✅ SendGrid email service initialized");
    }
  }

  /**
   * Helper gửi email chung, có log
   */
  private async sendEmail(
    to: string | string[],
    subject: string,
    html: string
  ) {
    const sendGridApiKey = this.configService.get<string>("SENDGRID_API_KEY");
    if (!sendGridApiKey) {
      this.logger.error("SendGrid API key is missing. Cannot send email.");
      throw new Error("Cấu hình email chưa được thiết lập.");
    }

    const msg = {
      to,
      from: {
        email: this.fromEmail,
        name: "Hệ thống Quản lý Tài sản",
      },
      subject,
      html,
    };

    await sgMail.send(msg);
    this.logger.log(
      `✅ Email sent to ${Array.isArray(to) ? to.join(",") : to}: ${subject}`
    );
  }

  /**
   * Gửi email quên mật khẩu
   */
  async sendPasswordResetEmail(
    email: string,
    fullName: string,
    resetToken: string
  ): Promise<void> {
    const resetUrl = `${this.configService.get<string>("FRONTEND_URL") || "http://localhost:3003"}/reset-password?token=${resetToken}`;

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
                            <a href="${resetUrl}" class="button text-white">Đặt lại mật khẩu</a>
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

    try {
      // Kiểm tra cấu hình SendGrid trước khi gửi
      const sendGridApiKey = this.configService.get<string>("SENDGRID_API_KEY");

      if (!sendGridApiKey) {
        this.logger.error("SendGrid API key is missing. Cannot send email.");
        throw new Error(
          "Cấu hình email chưa được thiết lập. Vui lòng liên hệ quản trị viên."
        );
      }

      const msg = {
        to: email,
        from: {
          email: this.fromEmail,
          name: "Hệ thống Quản lý Tài sản",
        },
        subject: "Đặt lại mật khẩu - Hệ thống Quản lý Tài sản",
        html: htmlContent,
      };

      await sgMail.send(msg);
      this.logger.log(
        `✅ Password reset email sent successfully to ${email} via SendGrid`
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to send password reset email to ${email}:`,
        error
      );

      // Log chi tiết lỗi
      if (error instanceof Error) {
        this.logger.error(`Error message: ${error.message}`);
        if (error.stack) {
          this.logger.error(`Error stack: ${error.stack}`);
        }
      }

      // Xử lý lỗi SendGrid cụ thể
      let errorMessage = "Không thể gửi email. Vui lòng thử lại sau.";

      if (error instanceof Error) {
        const errorMsg = error.message.toLowerCase();

        // Xử lý các lỗi phổ biến của SendGrid
        if (errorMsg.includes("unauthorized") || errorMsg.includes("api key")) {
          errorMessage =
            "Lỗi xác thực SendGrid. Vui lòng kiểm tra SENDGRID_API_KEY trong file .env.";
        } else if (errorMsg.includes("forbidden")) {
          errorMessage =
            "Không có quyền gửi email. Vui lòng kiểm tra quyền của SendGrid API key.";
        } else if (
          errorMsg.includes("rate limit") ||
          errorMsg.includes("too many requests")
        ) {
          errorMessage =
            "Đã vượt quá giới hạn gửi email. Vui lòng thử lại sau.";
        } else if (errorMsg.includes("invalid") && errorMsg.includes("email")) {
          errorMessage = "Địa chỉ email không hợp lệ.";
        } else if (errorMsg.includes("cấu hình")) {
          errorMessage = error.message;
        }
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Gửi thông báo khi tạo yêu cầu sửa chữa tới kỹ thuật viên
   */
  async sendRepairCreatedEmail(params: {
    technicianEmail: string;
    technicianName?: string;
    requestCode: string;
    assetName?: string;
    roomInfo?: string;
    description?: string;
  }) {
    const {
      technicianEmail,
      technicianName,
      requestCode,
      assetName,
      roomInfo,
      description,
    } = params;
    const subject = `[YCSC] Yêu cầu mới ${requestCode}`;
    const html = `
      <h3>Xin chào ${technicianName || "Kỹ thuật viên"},</h3>
      <p>Bạn được phân công xử lý yêu cầu sửa chữa mới.</p>
      <ul>
        <li><b>Mã yêu cầu:</b> ${requestCode}</li>
        ${assetName ? `<li><b>Tài sản:</b> ${assetName}</li>` : ""}
        ${roomInfo ? `<li><b>Vị trí:</b> ${roomInfo}</li>` : ""}
      </ul>
      ${description ? `<p><b>Mô tả:</b> ${description}</p>` : ""}
      <p>Vui lòng đăng nhập hệ thống để tiếp nhận.</p>
    `;
    await this.sendEmail(technicianEmail, subject, html);
  }

  /**
   * Gửi thông báo khi hoàn thành sửa chữa tới người báo lỗi
   */
  async sendRepairCompletedEmail(params: {
    reporterEmail: string;
    reporterName?: string;
    requestCode: string;
    resolutionNotes?: string;
  }) {
    const { reporterEmail, reporterName, requestCode, resolutionNotes } =
      params;
    const subject = `[YCSC] Đã hoàn thành ${requestCode}`;
    const html = `
      <h3>Xin chào ${reporterName || "Anh/Chị"},</h3>
      <p>Yêu cầu sửa chữa <b>${requestCode}</b> đã được hoàn thành.</p>
      ${resolutionNotes ? `<p><b>Kết quả:</b> ${resolutionNotes}</p>` : ""}
      <p>Vui lòng kiểm tra thiết bị và phản hồi nếu còn vấn đề.</p>
    `;
    await this.sendEmail(reporterEmail, subject, html);
  }

  /**
   * Gửi thông báo khi yêu cầu chuyển sang CHỜ_THAY_THẾ
   */
  async sendRepairWaitingReplacementEmail(params: {
    reporterEmail?: string;
    reporterName?: string;
    teamLeadEmails: string[];
    requestCode: string;
    components?: string[];
  }) {
    const {
      reporterEmail,
      reporterName,
      teamLeadEmails,
      requestCode,
      components,
    } = params;
    const recipients = [
      ...(reporterEmail ? [reporterEmail] : []),
      ...teamLeadEmails,
    ];

    if (recipients.length === 0) {
      this.logger.warn(
        `No recipients for waiting replacement email of ${requestCode}`
      );
      return;
    }

    const subject = `[YCSC] Cần thay thế linh kiện - ${requestCode}`;
    const componentsHtml =
      components && components.length > 0
        ? `<p><b>Linh kiện cần thay:</b> ${components.join(", ")}</p>`
        : "";
    const greeting = reporterName ? `Xin chào ${reporterName},` : "Xin chào,";
    const html = `
      <h3>${greeting}</h3>
      <p>Yêu cầu sửa chữa <b>${requestCode}</b> đã chuyển sang trạng thái <b>CHỜ_THAY_THẾ</b>.</p>
      ${componentsHtml}
      <p>Vui lòng lập/duyệt đề xuất thay thế để tiếp tục xử lý.</p>
    `;

    await this.sendEmail(recipients, subject, html);
  }

  /**
   * Gửi thông báo khi hoàn thành trang bị phần mềm
   */
  async sendSoftwareProvisionedEmail(params: {
    proposerEmail: string;
    proposerName?: string;
    proposalCode: string;
    roomName?: string;
    softwareList?: string[];
  }) {
    const {
      proposerEmail,
      proposerName,
      proposalCode,
      roomName,
      softwareList,
    } = params;
    const subject = `[DXPM] Đã trang bị phần mềm - ${proposalCode}`;
    const listHtml =
      softwareList && softwareList.length > 0
        ? `<p><b>Danh sách phần mềm:</b> ${softwareList.join(", ")}</p>`
        : "";
    const html = `
      <h3>Xin chào ${proposerName || "Anh/Chị"},</h3>
      <p>Đề xuất phần mềm <b>${proposalCode}</b> đã được trang bị.</p>
      ${roomName ? `<p><b>Phòng:</b> ${roomName}</p>` : ""}
      ${listHtml}
      <p>Vui lòng kiểm tra và phản hồi nếu cần hỗ trợ thêm.</p>
    `;

    await this.sendEmail(proposerEmail, subject, html);
  }

  /**
   * Gửi thông báo khi hoàn tất mua sắm linh kiện thay thế
   */
  async sendReplacementProcurementDoneEmail(params: {
    proposerEmail: string;
    proposerName?: string;
    technicianEmails: string[];
    proposalCode: string;
  }) {
    const { proposerEmail, proposerName, technicianEmails, proposalCode } =
      params;
    const recipients = [proposerEmail, ...technicianEmails.filter(Boolean)];
    const subject = `[DXTT] Đã hoàn tất mua sắm - ${proposalCode}`;
    const html = `
      <h3>Xin chào ${proposerName || "Anh/Chị"},</h3>
      <p>Đề xuất thay thế <b>${proposalCode}</b> đã hoàn tất mua sắm.</p>
      <p>Vui lòng tiến hành thay thế linh kiện và cập nhật hệ thống.</p>
    `;

    await this.sendEmail(recipients, subject, html);
  }
}
