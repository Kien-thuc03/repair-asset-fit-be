import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { ReplacementProposalsService } from "./replacement-proposals.service";
import { ReplacementProposalFilterDto } from "./dto/replacement-proposal-filter.dto";
import { ReplacementProposalResponseDto } from "./dto/replacement-proposal-response.dto";
import { UpdateReplacementProposalStatusDto } from "./dto/update-replacement-proposal-status.dto";
import { CreateReplacementProposalDto } from "./dto/create-replacement-proposal.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";
import { ReplacementStatus } from "../../common/shared/ReplacementStatus";
import { RepairStatus } from "../../common/shared/RepairStatus";

@ApiTags("Replacement Proposals")
@Controller("api/v1/replacement-proposals")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReplacementProposalsController {
  constructor(
    private readonly replacementProposalsService: ReplacementProposalsService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Tạo đề xuất thay thế linh kiện mới",
    description: `
      Tạo một đề xuất thay thế linh kiện/thiết bị mới.
      
      **Quy trình:**
      1. Tự động sinh mã đề xuất (DXTT-YYYY-NNNN)
      2. Tạo đề xuất với trạng thái CHỜ_TỔ_TRƯỞNG_DUYỆT
      3. Tạo danh sách items cần thay thế (có thể nhiều items cùng lúc)
      4. Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
      
      **Lưu ý:**
      - Người dùng hiện tại (từ JWT token) sẽ được ghi nhận là người tạo đề xuất
      - Có thể đề xuất nhiều linh kiện khác nhau trong cùng một đề xuất
      - Mỗi item có thể có hoặc không có linh kiện cũ liên kết (oldComponentId)
      - Nếu có oldComponentId, hệ thống sẽ lưu thông tin linh kiện cũ cần thay
      
      **Mã đề xuất tự động:**
      - Format: DXTT-YYYY-NNNN
      - VD: DXTT-2025-0001, DXTT-2025-0002...
      - Tự động tăng theo số thứ tự trong năm
    `,
  })
  @ApiBody({
    type: CreateReplacementProposalDto,
    examples: {
      "single-component": {
        summary: "Đề xuất thay thế 1 linh kiện",
        description: "Đề xuất thay thế RAM bị hỏng",
        value: {
          title: "Đề xuất thay thế RAM máy tính phòng H.02",
          description:
            "RAM của máy 05 phòng H.02 bị lỗi Blue Screen, cần thay thế gấp để đảm bảo giảng dạy",
          items: [
            {
              oldComponentId: "669b36d4-6ec8-485a-8162-e882fb1368c7",
              newItemName: "Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz",
              newItemSpecs:
                "DDR4, 16GB (2x8GB), 3200MHz, CL16, Non-ECC, DIMM, 1.35V",
              quantity: 1,
              reason:
                "RAM hiện tại (8GB) gặp lỗi Blue Screen thường xuyên, không đủ dung lượng cho phần mềm thiết kế",
            },
          ],
          repairRequestIds: ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
        },
      },
      "multiple-components": {
        summary: "Đề xuất thay thế nhiều linh kiện",
        description: "Đề xuất thay thế toàn bộ bộ nhớ và ổ cứng",
        value: {
          title: "Đề xuất nâng cấp RAM và SSD cho phòng máy H.03",
          description:
            "Phòng H.03 cần nâng cấp RAM và SSD để đáp ứng yêu cầu chạy các phần mềm thiết kế đồ họa nặng",
          items: [
            {
              oldComponentId: "ccdceeb5-21b0-418d-a188-0372e573b861",
              newItemName: "Kingston Fury Beast DDR4 32GB (2x16GB) 3600MHz",
              newItemSpecs: "DDR4, 32GB (2x16GB), 3600MHz, CL18, Non-ECC, DIMM",
              quantity: 10,
              reason:
                "RAM 8GB không đủ cho các tác vụ render và thiết kế đồ họa",
            },
            {
              oldComponentId: "b1c3635e-1705-4ef4-ae1f-613ab1686f35",
              newItemName: "Samsung 980 PRO NVMe SSD 1TB",
              newItemSpecs:
                "NVMe PCIe Gen 4.0 x4, 1TB, Read: 7000MB/s, Write: 5000MB/s, M.2 2280",
              quantity: 10,
              reason:
                "SSD 256GB quá nhỏ, cần nâng cấp lên 1TB để lưu trữ dự án",
            },
          ],
          repairRequestIds: [
            "b2c3d4e5-f6a7-8901-bcde-f12345678901",
            "c3d4e5f6-a7b8-9012-cdef-123456789012",
          ],
        },
      },
      "new-equipment": {
        summary: "Đề xuất mua thiết bị mới (không có linh kiện cũ)",
        description: "Đề xuất mua thiết bị mới cho phòng máy mới",
        value: {
          title: "Đề xuất mua màn hình mới cho phòng H.06",
          description:
            "Phòng H.06 mới thành lập, cần mua thêm màn hình cho các máy tính",
          items: [
            {
              newItemName: "Dell UltraSharp U2422H 24 inch",
              newItemSpecs:
                "24 inch, IPS, 1920x1080, 60Hz, 5ms, HDMI, DisplayPort, USB-C",
              quantity: 30,
              reason: "Phòng mới chưa có màn hình, cần mua cho 30 máy tính",
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Tạo đề xuất thành công",
    type: ReplacementProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu không hợp lệ",
    schema: {
      example: {
        statusCode: 400,
        message: ["Phải có ít nhất 1 linh kiện cần thay thế"],
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập",
  })
  async create(
    @Body() createDto: CreateReplacementProposalDto,
    @CurrentUser() user: User
  ): Promise<ReplacementProposalResponseDto> {
    return this.replacementProposalsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách đề xuất thay thế linh kiện",
    description: `
      Lấy danh sách tất cả đề xuất thay thế linh kiện với khả năng lọc và phân trang.
      
      **Tính năng lọc:**
      - Theo người đề xuất (proposerId)
      - Theo tổ trưởng kỹ thuật duyệt (teamLeadApproverId)
      - Theo admin xác minh (adminVerifierId)
      - Theo trạng thái (status)
      - Tìm kiếm theo mã đề xuất hoặc tiêu đề (search)
      - Theo khoảng thời gian (fromDate, toDate)
      
      **Phân trang và sắp xếp:**
      - Hỗ trợ phân trang với page và limit
      - Sắp xếp theo createdAt, updatedAt, proposalCode, status
      - Thứ tự ASC hoặc DESC
      
      **Quy trình đề xuất thay thế:**
      1. CHỜ_TỔ_TRƯỞNG_DUYỆT - Đang chờ tổ trưởng xem xét
      2. ĐÃ_DUYỆT - Tổ trưởng đã phê duyệt
      3. ĐÃ_LẬP_TỜ_TRÌNH - Đã lập tờ trình gửi lên
      4. ĐÃ_DUYỆT_TỜ_TRÌNH - Tờ trình đã được duyệt
      5. CHỜ_XÁC_MINH - Chờ admin xác minh
      6. ĐÃ_XÁC_MINH - Admin đã xác minh
      7. ĐÃ_GỬI_BIÊN_BẢN - Đã gửi biên bản
      8. ĐÃ_KÝ_BIÊN_BẢN - Biên bản đã được ký
      9. ĐÃ_HOÀN_TẤT_MUA_SẮM - Hoàn tất quy trình
    `,
  })
  @ApiQuery({
    name: "proposerId",
    required: false,
    description: "Lọc theo ID người đề xuất",
  })
  @ApiQuery({
    name: "teamLeadApproverId",
    required: false,
    description: "Lọc theo ID tổ trưởng kỹ thuật",
  })
  @ApiQuery({
    name: "adminVerifierId",
    required: false,
    description: "Lọc theo ID admin xác minh",
  })
  @ApiQuery({
    name: "status",
    required: false,
    enum: ReplacementStatus,
    description: "Lọc theo trạng thái",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Tìm kiếm theo mã hoặc tiêu đề",
  })
  @ApiQuery({
    name: "fromDate",
    required: false,
    description: "Từ ngày (ISO string)",
  })
  @ApiQuery({
    name: "toDate",
    required: false,
    description: "Đến ngày (ISO string)",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (từ 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng/trang",
    example: 10,
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    description: "Trường sắp xếp",
    example: "createdAt",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    description: "Thứ tự sắp xếp",
    example: "DESC",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách thành công",
    schema: {
      example: {
        data: [
          {
            id: "a46cde68-1fe6-48ea-93a8-ce8892705c95",
            proposalCode: "DXTT-H02-006-2024",
            title: "Đề xuất thay thế CPU và Mainboard phòng H.02",
            description: "CPU và mainboard quá cũ, không đáp ứng yêu cầu...",
            status: "ĐÃ_LẬP_TỜ_TRÌNH",
            proposer: {
              id: "xxx",
              username: "nguyenvana",
              fullName: "Nguyễn Văn A",
              email: "nguyenvana@example.com",
            },
            itemsCount: 2,
            createdAt: "2025-10-26T06:00:43.742Z",
            updatedAt: "2025-10-26T06:00:43.742Z",
          },
        ],
        total: 6,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  })
  async findAll(@Query() filter: ReplacementProposalFilterDto) {
    return this.replacementProposalsService.findAll(filter);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Lấy chi tiết đề xuất thay thế",
    description: `
      Lấy thông tin chi tiết của một đề xuất thay thế bao gồm:
      - Thông tin cơ bản của đề xuất
      - Người đề xuất, tổ trưởng duyệt, admin xác minh
      - Danh sách linh kiện cần thay thế (items)
      - Thông tin linh kiện cũ và linh kiện mới (nếu có)
      - Trạng thái hiện tại và lịch sử
      
      **Thông tin linh kiện cũ bao gồm:**
      - Loại linh kiện (CPU, RAM, GPU, v.v.)
      - Tên và thông số kỹ thuật
      - Trạng thái hiện tại
      - Thông tin máy tính và phòng chứa linh kiện
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất thay thế",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy thông tin thành công",
    type: ReplacementProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy đề xuất",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy đề xuất thay thế với ID: xxx",
        error: "Not Found",
      },
    },
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<ReplacementProposalResponseDto> {
    return this.replacementProposalsService.findOne(id);
  }

  @Put(":id/status")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Cập nhật trạng thái đề xuất thay thế",
    description: `
      Cập nhật trạng thái của đề xuất thay thế theo quy trình.
      
      **Quy trình chuyển trạng thái hợp lệ:**
      
      1. **CHỜ_TỔ_TRƯỞNG_DUYỆT** →
         - ĐÃ_DUYỆT (Tổ trưởng phê duyệt)
         - ĐÃ_TỪ_CHỐI (Tổ trưởng từ chối)
      
      2. **ĐÃ_DUYỆT** →
         - ĐÃ_LẬP_TỜ_TRÌNH (Lập tờ trình gửi lên)
         - CHỜ_TỔ_TRƯỞNG_DUYỆT (Gửi lại để xem xét)
      
      3. **ĐÃ_TỪ_CHỐI** →
         - CHỜ_TỔ_TRƯỞNG_DUYỆT (Gửi lại để xem xét)
      
      4. **ĐÃ_LẬP_TỜ_TRÌNH** →
         - ĐÃ_DUYỆT_TỜ_TRÌNH (Tờ trình được duyệt)
         - ĐÃ_TỪ_CHỐI_TỜ_TRÌNH (Tờ trình bị từ chối)
      
      5. **ĐÃ_DUYỆT_TỜ_TRÌNH** →
         - CHỜ_XÁC_MINH (Chuyển cho admin xác minh)
      
      6. **ĐÃ_TỪ_CHỐI_TỜ_TRÌNH** →
         - ĐÃ_LẬP_TỜ_TRÌNH (Lập lại tờ trình)
      
      7. **CHỜ_XÁC_MINH** →
         - ĐÃ_XÁC_MINH (Admin xác minh)
      
      8. **ĐÃ_XÁC_MINH** →
         - ĐÃ_GỬI_BIÊN_BẢN (Gửi biên bản)
      
      9. **ĐÃ_GỬI_BIÊN_BẢN** →
         - ĐÃ_KÝ_BIÊN_BẢN (Biên bản được ký)
      
      10. **ĐÃ_KÝ_BIÊN_BẢN** →
          - ĐÃ_HOÀN_TẤT_MUA_SẮM (Hoàn tất mua sắm)
      
      **Lưu ý:**
      - Khi chuyển sang ĐÃ_DUYỆT hoặc ĐÃ_TỪ_CHỐI: teamLeadApproverId tự động được set
      - Khi chuyển sang ĐÃ_XÁC_MINH trở đi: adminVerifierId tự động được set
      - Có thể upload file tờ trình (submissionFormUrl) và biên bản (verificationReportUrl)
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất thay thế",
    format: "uuid",
  })
  @ApiBody({
    type: UpdateReplacementProposalStatusDto,
    examples: {
      "team-lead-approve": {
        summary: "Tổ trưởng: Duyệt đề xuất",
        description: "Tổ trưởng kỹ thuật phê duyệt đề xuất thay thế",
        value: {
          status: "ĐÃ_DUYỆT",
        },
      },
      "team-lead-reject": {
        summary: "Tổ trưởng: Từ chối đề xuất",
        description: "Tổ trưởng kỹ thuật từ chối đề xuất",
        value: {
          status: "ĐÃ_TỪ_CHỐI",
        },
      },
      "submit-form": {
        summary: "Lập tờ trình",
        description: "Lập tờ trình và upload file",
        value: {
          status: "ĐÃ_LẬP_TỜ_TRÌNH",
          submissionFormUrl: "/uploads/proposals/to-trinh-thay-the-h02-001.pdf",
        },
      },
      "admin-verify": {
        summary: "Admin: Xác minh",
        description: "Admin xác minh tại hiện trường",
        value: {
          status: "ĐÃ_XÁC_MINH",
          verificationReportUrl:
            "/uploads/proposals/bien-ban-xac-minh-h02-001.pdf",
        },
      },
      "send-report": {
        summary: "Gửi biên bản",
        description: "Gửi biên bản xác nhận",
        value: {
          status: "ĐÃ_GỬI_BIÊN_BẢN",
        },
      },
      "sign-report": {
        summary: "Ký biên bản",
        description: "Biên bản được ký xác nhận",
        value: {
          status: "ĐÃ_KÝ_BIÊN_BẢN",
        },
      },
      "complete-purchase": {
        summary: "Hoàn tất mua sắm",
        description: "Đánh dấu đã hoàn tất quy trình mua sắm",
        value: {
          status: "ĐÃ_HOÀN_TẤT_MUA_SẮM",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cập nhật trạng thái thành công",
    type: ReplacementProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Chuyển trạng thái không hợp lệ",
    schema: {
      example: {
        statusCode: 400,
        message:
          'Không thể chuyển từ trạng thái "ĐÃ_HOÀN_TẤT_MUA_SẮM" sang "CHỜ_TỔ_TRƯỞNG_DUYỆT". Các trạng thái hợp lệ: Không có',
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy đề xuất",
  })
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateReplacementProposalStatusDto,
    @CurrentUser() user: User
  ): Promise<ReplacementProposalResponseDto> {
    return this.replacementProposalsService.updateStatus(id, updateDto, user);
  }

  @Get("proposals/proposers/:proposerId")
  @ApiOperation({
    summary: "Lấy danh sách đề xuất theo người đề xuất",
    description: `
      Lấy tất cả đề xuất thay thế do một người dùng cụ thể tạo ra.
      
      **Sử dụng khi:**
      - Người dùng xem lịch sử đề xuất của mình
      - Quản trị viên theo dõi đề xuất của một người cụ thể
      - Thống kê số lượng đề xuất theo người đề xuất
      
      **Thông tin trả về:**
      - Danh sách đầy đủ các đề xuất
      - Bao gồm items, trạng thái và người duyệt
      - Sắp xếp theo thời gian tạo mới nhất
    `,
  })
  @ApiParam({
    name: "proposerId",
    description: "ID của người đề xuất",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách thành công",
    type: [ReplacementProposalResponseDto],
  })
  async getProposalsByProposer(
    @Param("proposerId", ParseUUIDPipe) proposerId: string
  ): Promise<ReplacementProposalResponseDto[]> {
    return this.replacementProposalsService.findByProposer(proposerId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Xóa đề xuất thay thế",
    description: `
      Xóa một đề xuất thay thế khỏi hệ thống.
      
      **Quyền hạn:**
      - Người đề xuất (proposer): Chỉ có thể xóa đề xuất của mình khi trạng thái là CHỜ_TỔ_TRƯỞNG_DUYỆT hoặc ĐÃ_TỪ_CHỐI
      - Admin/Tổ trưởng kỹ thuật: Có thể xóa bất kỳ đề xuất nào (trừ khi đã hoàn tất mua sắm)
      
      **Quy trình xóa:**
      1. Kiểm tra quyền xóa của người dùng
      2. Kiểm tra trạng thái đề xuất (không cho xóa nếu đã hoàn tất mua sắm)
      3. Rollback component status từ PENDING_REPLACEMENT về FAULTY (nếu proposal chưa được duyệt)
      4. Xóa tất cả replacement items liên quan
      5. Xóa đề xuất (proposal_repair_requests tự động xóa do CASCADE)
      
      **Lưu ý:**
      - Không thể xóa đề xuất đã hoàn tất mua sắm (ĐÃ_HOÀN_TẤT_MUA_SẮM)
      - Khi xóa proposal ở trạng thái CHỜ_TỔ_TRƯỞNG_DUYỆT hoặc ĐÃ_TỪ_CHỐI, 
        các component có status PENDING_REPLACEMENT sẽ được rollback về FAULTY
      - Tất cả replacement items và liên kết với repair requests sẽ bị xóa
      - proposal_repair_requests sẽ tự động xóa do CASCADE constraint
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất thay thế cần xóa",
    format: "uuid",
    example: "a46cde68-1fe6-48ea-93a8-ce8892705c95",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Xóa đề xuất thay thế thành công",
    schema: {
      example: {
        message: "Xóa đề xuất thay thế DXTT-2025-0001 thành công",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy đề xuất thay thế",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy đề xuất thay thế với ID: xxx",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền xóa đề xuất này",
    schema: {
      example: {
        statusCode: 403,
        message:
          "Bạn không có quyền xóa đề xuất này. Chỉ có thể xóa đề xuất ở trạng thái CHỜ_TỔ_TRƯỞNG_DUYỆT hoặc ĐÃ_TỪ_CHỐI, hoặc bạn phải là Admin/Tổ trưởng.",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Không thể xóa đề xuất đã hoàn tất mua sắm",
    schema: {
      example: {
        statusCode: 400,
        message:
          "Không thể xóa đề xuất đã hoàn tất mua sắm. Vui lòng liên hệ quản trị viên nếu cần điều chỉnh.",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    return this.replacementProposalsService.remove(id, user);
  }

  /**
   * Từ chối đề xuất và khôi phục trạng thái linh kiện liên quan
   */
  @Patch(":id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Từ chối đề xuất thay thế (rollback linh kiện)",
    description:
      "Đặt trạng thái đề xuất về ĐÃ_TỪ_CHỐI và rollback linh kiện từ PENDING_REPLACEMENT về FAULTY.",
  })
  @ApiParam({
    name: "id",
    description: "ID đề xuất thay thế cần từ chối",
    format: "uuid",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          example: "Không đủ ngân sách hoặc thông tin chưa đầy đủ",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Từ chối đề xuất thành công",
    type: ReplacementProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy đề xuất",
  })
  rejectProposal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body("reason") reason: string,
    @CurrentUser() user: User
  ) {
    console.log("🚫 Controller /reject", { id, reason, user: user.id });
    return this.replacementProposalsService.reject(id, reason, user);
  }
}
