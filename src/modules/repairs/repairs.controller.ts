import {
  Controller,
  Post,
  Get,
  Put,
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
import { RepairsService } from "./repairs.service";
import { CreateRepairRequestDto } from "./dto/create-repair-request.dto";
import { UpdateRepairRequestDto } from "./dto/update-repair-request.dto";
import { RepairRequestFilterDto } from "./dto/repair-request-filter.dto";
import { StartProcessingDto } from "./dto/start-processing.dto";
import { RepairRequestResponseDto } from "./dto/repair-request-response.dto";
import { CreateAndProcessRepairRequestDto } from "./dto/create-and-process-repair-request.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";

@ApiTags("Repairs")
@Controller("api/v1/repairs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Tạo yêu cầu sửa chữa mới",
    description: `
      Tạo một yêu cầu sửa chữa mới cho tài sản (máy tính) gặp sự cố.
      
      **Quy trình:**
      1. Kiểm tra tài sản có tồn tại và hợp lệ
      2. Kiểm tra tài sản có đang được sửa chữa không
      3. Tự động sinh mã yêu cầu (YCSC-YYYY-NNNN)
      4. Tạo yêu cầu với trạng thái CHỜ_TIẾP_NHẬN
      5. Cập nhật trạng thái tài sản thành UNDER_REPAIR
      
      **Lưu ý:**
      - Người dùng hiện tại (từ JWT token) sẽ được ghi nhận là người báo lỗi
      - ErrorTypeId là tùy chọn, có thể được cập nhật sau bởi kỹ thuật viên
      - MediaUrls để lưu ảnh/video minh họa lỗi
    `,
  })
  @ApiBody({ type: CreateRepairRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Tạo yêu cầu sửa chữa thành công",
    type: RepairRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu không hợp lệ hoặc tài sản không phù hợp",
    schema: {
      example: {
        statusCode: 400,
        message: "Tài sản này đã bị xóa, không thể tạo yêu cầu sửa chữa",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy tài sản hoặc loại lỗi",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy tài sản với ID: xxx",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Tài sản đang có yêu cầu sửa chữa khác đang xử lý",
    schema: {
      example: {
        statusCode: 409,
        message:
          "Tài sản này đang có yêu cầu sửa chữa đang xử lý (YCSC-2025-0001)",
        error: "Conflict",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async create(
    @Body() createRepairRequestDto: CreateRepairRequestDto,
    @CurrentUser() user: User
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.create(createRepairRequestDto, user);
  }

  @Post("process-onsite")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Ghi nhận và xử lý lỗi trực tiếp tại hiện trường",
    description: `
      Endpoint dành cho kỹ thuật viên để ghi nhận lỗi VÀ xử lý ngay tại chỗ trong một lần submit.
      
      **Workflow mới:**
      1. Ghi nhận thông tin lỗi (asset, description, errorType, components/software)
      2. Thực hiện xử lý trực tiếp tại hiện trường
      3. Ghi nhận kết quả xử lý (resolutionNotes)
      4. Chọn trạng thái cuối: ĐÃ_HOÀN_THÀNH, CHỜ_THAY_THẾ, hoặc ĐANG_XỬ_LÝ (mặc định)
      
      **Các kết quả xử lý:**
      
      **A. Lỗi phần mềm (errorType = MAY_HU_PHAN_MEM):**
      - Bắt buộc có \`softwareIds\` (danh sách phần mềm bị lỗi)
      - finalStatus chỉ có thể là \`ĐÃ_HOÀN_THÀNH\`
      - Ví dụ: Cài đặt lại Windows, update driver, kill virus, cài lại Office
      
      **B. Lỗi phần cứng (errorType khác MAY_HU_PHAN_MEM):**
      - Bắt buộc có \`componentIds\` (danh sách linh kiện bị lỗi)
      
      B.1. **Sửa chữa thành công tại chỗ:**
      - finalStatus = \`ĐÃ_HOÀN_THÀNH\`
      - Ví dụ: Thay cáp VGA, làm sạch tiếp xúc RAM, vặn chặt ốc
      - Asset status tự động chuyển từ DAMAGED → IN_USE
      
      B.2. **Cần thay thế linh kiện:** 🔥 ĐÃ CẬP NHẬT
      - finalStatus = \`CHỜ_THAY_THẾ\`
      - Repair request status = \`CHỜ_THAY_THẾ\` (ngay lập tức)
      - Bắt buộc có \`componentIds\` (linh kiện cần thay thế)
      - Component status = \`FAULTY\` (giữ nguyên, CHƯA chuyển PENDING_REPLACEMENT)
      - Asset status = \`DAMAGED\` (giữ nguyên)
      
      **Flow tiếp theo:**
      1. Kỹ thuật viên lập phiếu đề xuất thay thế
      2. → Component status: FAULTY → PENDING_REPLACEMENT (khi tạo proposal)
      3. Tổ trưởng duyệt proposal
      4. Thay thế linh kiện xong
      5. → Repair request: CHỜ_THAY_THẾ → ĐÃ_HOÀN_THÀNH
      6. → Component mới: INSTALLED
      
      **C. Chỉ ghi nhận lỗi (không xử lý ngay):**
      - Không cung cấp \`finalStatus\` và \`resolutionNotes\`
      - Repair request được tạo với status \`ĐANG_XỬ_LÝ\`
      - Có thể xử lý sau bằng endpoint PATCH /:id
      
      **Validation:**
      - Kiểm tra component/software không đang trong repair request khác chưa hoàn thành
      - Lỗi phần mềm chỉ có thể finalStatus = ĐÃ_HOÀN_THÀNH
      - finalStatus chỉ cho phép ĐÃ_HOÀN_THÀNH hoặc CHỜ_THAY_THẾ
      - Có finalStatus bắt buộc phải có resolutionNotes
    `,
  })
  @ApiBody({ type: CreateAndProcessRepairRequestDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Ghi nhận và xử lý lỗi thành công",
    type: RepairRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu không hợp lệ hoặc vi phạm business logic",
    schema: {
      examples: {
        invalidFinalStatus: {
          summary: "finalStatus không hợp lệ",
          value: {
            statusCode: 400,
            message:
              "finalStatus chỉ có thể là ĐÃ_HOÀN_THÀNH hoặc CHỜ_THAY_THẾ",
            error: "Bad Request",
          },
        },
        missingResolutionNotes: {
          summary: "Thiếu ghi chú xử lý khi có finalStatus",
          value: {
            statusCode: 400,
            message:
              "Bắt buộc phải nhập ghi chú xử lý (resolutionNotes) khi chọn trạng thái ĐÃ_HOÀN_THÀNH",
            error: "Bad Request",
          },
        },
        softwareWrongStatus: {
          summary: "Lỗi phần mềm chỉ được ĐÃ_HOÀN_THÀNH",
          value: {
            statusCode: 400,
            message:
              "Lỗi phần mềm (MAY_HU_PHAN_MEM) chỉ có thể có trạng thái cuối cùng là ĐÃ_HOÀN_THÀNH",
            error: "Bad Request",
          },
        },
        softwareNoSoftwareIds: {
          summary: "Lỗi phần mềm thiếu softwareIds",
          value: {
            statusCode: 400,
            message:
              "Bắt buộc phải chọn ít nhất 1 phần mềm (softwareIds) khi errorType là MAY_HU_PHAN_MEM",
            error: "Bad Request",
          },
        },
        hardwareNoComponents: {
          summary: "Lỗi phần cứng thiếu componentIds",
          value: {
            statusCode: 400,
            message:
              "Bắt buộc phải chọn ít nhất 1 linh kiện (componentIds) khi xử lý lỗi phần cứng",
            error: "Bad Request",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "Component đang trong repair request khác chưa hoàn thành",
    schema: {
      example: {
        statusCode: 409,
        message:
          "Không thể tạo yêu cầu sửa chữa mới vì một số component đang trong yêu cầu sửa chữa khác chưa hoàn thành:\n  - YCSC-2025-0003 (CHỜ_TIẾP_NHẬN): intel core i3, màn hình\n\nVui lòng đợi các yêu cầu này hoàn thành hoặc loại bỏ các component đang được sửa chữa khỏi yêu cầu mới.",
        error: "Conflict",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy asset, component hoặc software",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async createAndProcessOnsite(
    @Body() dto: CreateAndProcessRepairRequestDto,
    @CurrentUser() user: User
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.createAndProcess(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách yêu cầu sửa chữa",
    description: `
      Lấy danh sách tất cả yêu cầu sửa chữa với khả năng lọc và phân trang.
      
      **Tính năng lọc:**
      - Theo tài sản (computerAssetId)
      - Theo người báo lỗi (reporterId)
      - Theo kỹ thuật viên (assignedTechnicianId)
      - Theo trạng thái (status)
      - Theo loại lỗi (errorType)
      - Tìm kiếm theo mã yêu cầu hoặc mô tả (search)
      - Theo khoảng thời gian (fromDate, toDate)
      
      **Phân trang và sắp xếp:**
      - Hỗ trợ phân trang với page và limit
      - Sắp xếp theo createdAt, requestCode, status
      - Thứ tự ASC hoặc DESC
    `,
  })
  @ApiQuery({
    name: "computerAssetId",
    required: false,
    description: "Lọc theo ID tài sản",
  })
  @ApiQuery({
    name: "reporterId",
    required: false,
    description: "Lọc theo ID người báo lỗi",
  })
  @ApiQuery({
    name: "assignedTechnicianId",
    required: false,
    description: "Lọc theo ID kỹ thuật viên",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Lọc theo trạng thái",
  })
  @ApiQuery({
    name: "errorType",
    required: false,
    description: "Lọc theo loại lỗi",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Tìm kiếm theo mã hoặc mô tả",
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
        data: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      },
    },
  })
  async findAll(@Query() filter: RepairRequestFilterDto) {
    return this.repairsService.findAll(filter);
  }

  @Get(":id/logs")
  @ApiOperation({
    summary: "Lấy lịch sử thay đổi (repair logs) của yêu cầu sửa chữa",
    description: `
      Lấy toàn bộ lịch sử thay đổi trạng thái và các hành động đã thực hiện 
      trên yêu cầu sửa chữa.

      **Thông tin trả về:**
      - ID và nội dung hành động
      - Trạng thái trước và sau
      - Ghi chú/comment
      - Thời gian thực hiện
      - Thông tin người thực hiện (actor)

      **Use cases:**
      - Xem lịch sử xử lý yêu cầu
      - Audit trail cho yêu cầu sửa chữa
      - Kiểm tra ai đã thực hiện hành động gì và khi nào
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của yêu cầu sửa chữa",
    format: "uuid",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy repair logs thành công",
  })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy yêu cầu sửa chữa",
  })
  @Permissions("PERM_VIEW_REPAIR", "RA_PERM_VIEW_REPAIR")
  async getRepairLogs(@Param("id", ParseUUIDPipe) id: string) {
    return this.repairsService.getRepairLogs(id);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Lấy chi tiết yêu cầu sửa chữa",
    description:
      "Lấy thông tin chi tiết của một yêu cầu sửa chữa bao gồm thông tin tài sản, người báo lỗi, kỹ thuật viên và lịch sử xử lý.",
  })
  @ApiParam({
    name: "id",
    description: "ID của yêu cầu sửa chữa",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy thông tin thành công",
    type: RepairRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy yêu cầu sửa chữa",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy yêu cầu sửa chữa với ID: xxx",
        error: "Not Found",
      },
    },
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Cập nhật yêu cầu sửa chữa",
    description: `
      Cập nhật thông tin yêu cầu sửa chữa theo quy trình thực tế.
      
      **Quy trình hoạt động:**
      1. Giảng viên tạo yêu cầu sửa chữa → Trạng thái CHỜ_TIẾP_NHẬN
      2. Kỹ thuật viên xem yêu cầu trong phạm vi tầng được phân công
      3. Kỹ thuật viên tự cập nhật trạng thái và xử lý
      
      **Quyền hạn theo role:**
      - Người báo lỗi (Giảng viên): Chỉ có thể cập nhật khi CHỜ_TIẾP_NHẬN
      - Kỹ thuật viên: Cập nhật yêu cầu trong tầng được phân công
      - Tổ trưởng Kỹ thuật: Cập nhật tất cả yêu cầu
      - Trưởng phòng quản trị: Cập nhật bất kỳ yêu cầu nào
      
      **Phân công theo tầng:**
      - Kỹ thuật viên được phân công theo building + floor
      - Chỉ có thể xem/xử lý yêu cầu trong tầng được giao
      - Tự động gán assignedTechnicianId khi tiếp nhận
      
      **Quy tắc chuyển trạng thái:**
      - CHỜ_TIẾP_NHẬN → ĐÃ_TIẾP_NHẬN, ĐÃ_HỦY
      - ĐÃ_TIẾP_NHẬN → ĐANG_XỬ_LÝ, ĐÃ_HỦY  
      - ĐANG_XỬ_LÝ → CHỜ_THAY_THẾ, ĐÃ_HOÀN_THÀNH, ĐÃ_HỦY
      - CHỜ_THAY_THẾ → ĐANG_XỬ_LÝ, ĐÃ_HOÀN_THÀNH, ĐÃ_HỦY
      
      **Tự động cập nhật:**
      - acceptedAt + assignedTechnicianId khi chuyển sang ĐÃ_TIẾP_NHẬN
      - completedAt khi chuyển sang ĐÃ_HOÀN_THÀNH
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của yêu cầu sửa chữa",
    format: "uuid",
    example: "8f0d400e-74f5-4415-a668-3eb37137bda1",
  })
  @ApiBody({
    type: UpdateRepairRequestDto,
    examples: {
      "tiep-nhan-yeu-cau": {
        summary: "Kỹ thuật viên tiếp nhận yêu cầu",
        description:
          "Kỹ thuật viên tự tiếp nhận yêu cầu trong tầng được phân công",
        value: {
          status: "ĐÃ_TIẾP_NHẬN",
          description:
            "Đã tiếp nhận yêu cầu. Sẽ tiến hành kiểm tra chi tiết trong 30 phút.",
        },
      },
      "bat-dau-xu-ly": {
        summary: "Bắt đầu xử lý yêu cầu",
        description: "Chuyển sang trạng thái đang xử lý và cập nhật tiến độ",
        value: {
          status: "ĐANG_XỬ_LÝ",
          description:
            "Đã kiểm tra sơ bộ máy tính tại phòng 4A01.01 tầng 1 tòa A. Phát hiện nguồn điện có vấn đề - không có tín hiệu output. Đang tiến hành tháo rời để kiểm tra chi tiết.",
        },
      },
      "cap-nhat-mo-ta": {
        summary: "Cập nhật thông tin chẩn đoán",
        description: "Kỹ thuật viên cập nhật kết quả chẩn đoán chi tiết",
        value: {
          description:
            "**Vị trí:** Tòa A - Tầng 1 - Phòng 4A01.01\n**Triệu chứng:** Máy không khởi động, không có tín hiệu\n**Kiểm tra thực hiện:**\n1. Đèn LED nguồn: Không sáng ❌\n2. Quạt CPU: Không chạy ❌  \n3. Tín hiệu màn hình: Không có ❌\n4. Test nguồn với PSU tester: Không có output ❌\n**Chẩn đoán:** Nguồn điện 450W bị hỏng hoàn toàn",
          errorType: "MAY_KHONG_KHOI_DONG",
          mediaUrls: [
            "https://example.com/room-4a01-01-error.jpg",
            "https://example.com/psu-test-result.jpg",
          ],
        },
      },
      "cho-thay-the": {
        summary: "Chờ thay thế linh kiện",
        description: "Kỹ thuật viên xác định cần thay thế và đặt hàng",
        value: {
          status: "CHỜ_THAY_THẾ",
          resolutionNotes:
            "**Tầng phụ trách:** A-1 (Tòa A Tầng 1)\n**Kết quả chẩn đoán:**\n- Nguồn điện 450W bị cháy hoàn toàn\n- Mainboard và RAM test OK\n- Cần thay thế nguồn 500W\n\n**Đã thực hiện:**\n- Đặt hàng Cooler Master MWE Bronze V2 500W\n- Liên hệ nhà cung cấp Phong Vũ\n- Dự kiến nhận hàng: 2-3 ngày\n- Chi phí: 850.000đ",
        },
      },
      "hoan-thanh-sua-chua": {
        summary: "Hoàn thành sửa chữa",
        description: "Kết thúc quá trình sửa chữa thành công",
        value: {
          status: "ĐÃ_HOÀN_THÀNH",
          resolutionNotes:
            "Đã thay thế nguồn điện 500W Cooler Master MWE Bronze V2. Kiểm tra tất cả kết nối, test khởi động và chạy stress test 30 phút. Máy hoạt động ổn định, nhiệt độ bình thường. Đã bàn giao lại cho người dùng.",
        },
      },
      "huy-yeu-cau": {
        summary: "Hủy yêu cầu",
        description: "Hủy yêu cầu với lý do cụ thể",
        value: {
          status: "ĐÃ_HỦY",
          resolutionNotes:
            "Người dùng đã tự khắc phục sự cố bằng cách kiểm tra và cắm lại dây nguồn. Máy hoạt động bình thường.",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cập nhật yêu cầu sửa chữa thành công",
    type: RepairRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu không hợp lệ hoặc chuyển trạng thái không được phép",
    schema: {
      examples: {
        "invalid-status-transition": {
          summary: "Chuyển trạng thái không hợp lệ",
          value: {
            statusCode: 400,
            message:
              "Không thể chuyển từ trạng thái CHỜ_TIẾP_NHẬN sang ĐÃ_HOÀN_THÀNH",
            error: "Bad Request",
          },
        },
        "validation-error": {
          summary: "Lỗi validation",
          value: {
            statusCode: 400,
            message: [
              "ID kỹ thuật viên phải là UUID hợp lệ",
              "Mô tả không được vượt quá 2000 ký tự",
            ],
            error: "Bad Request",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền cập nhật yêu cầu này",
    schema: {
      example: {
        statusCode: 403,
        message: "Bạn không có quyền cập nhật yêu cầu này",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy yêu cầu sửa chữa",
    schema: {
      example: {
        statusCode: 404,
        message:
          "Không tìm thấy yêu cầu sửa chữa với ID: 8f0d400e-74f5-4415-a668-3eb37137bda1",
        error: "Not Found",
      },
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRepairRequestDto,
    @CurrentUser() user: User
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.update(id, updateDto, user);
  }

  @Get("rooms/:roomId/technicians")
  @ApiOperation({
    summary: "Lấy danh sách kỹ thuật viên phụ trách một phòng",
    description: `
      Lấy danh sách các kỹ thuật viên được phân công phụ trách một phòng cụ thể.
      
      **Logic phân công:**
      - Tìm KTV được phân công cho tầng cụ thể (building + floor)
      - Hoặc KTV quản lý cả tòa nhà (building + floor = null)
      
      **Sử dụng khi:**
      - Hiển thị danh sách KTV có thể xử lý yêu cầu từ phòng đó
      - Tự động gợi ý KTV khi tạo yêu cầu sửa chữa
      - Kiểm tra coverage phân công KTV theo phòng
    `,
  })
  @ApiParam({
    name: "roomId",
    description: "ID của phòng cần lấy danh sách KTV",
    format: "uuid",
    example: "a8c7f3e2-9b4d-4e1a-8f3c-2d5e6f7a8b9c",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách kỹ thuật viên thành công",
    schema: {
      example: [
        {
          id: "47d9013d-6c7e-48d2-8443-6300632ed811",
          username: "21011111",
          fullName: "Nguyễn Văn A",
          email: "nguyenvana@fit.hcmuaf.edu.vn",
          roles: [
            {
              id: "role-123",
              name: "TECHNICIAN",
            },
          ],
        },
        {
          id: "b8d7e6f5-c4a3-4b2a-9e8d-7c6b5a4f3e2d",
          username: "21011112",
          fullName: "Trần Thị B",
          email: "tranthib@fit.hcmuaf.edu.vn",
          roles: [
            {
              id: "role-124",
              name: "LEAD_TECHNICIAN",
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phòng hoặc không có KTV phụ trách",
    schema: {
      examples: {
        "room-not-found": {
          summary: "Không tìm thấy phòng",
          value: {
            statusCode: 404,
            message:
              "Không tìm thấy phòng với ID: a8c7f3e2-9b4d-4e1a-8f3c-2d5e6f7a8b9c",
            error: "Not Found",
          },
        },
        "no-technicians": {
          summary: "Không có KTV phụ trách",
          value: {
            statusCode: 404,
            message:
              "Không tìm thấy kỹ thuật viên được phân công cho phòng này (Tòa A - Tầng 3)",
            error: "Not Found",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async getTechniciansForRoom(
    @Param("roomId", ParseUUIDPipe) roomId: string
  ): Promise<User[]> {
    return this.repairsService.getTechniciansForRoom(roomId);
  }

  @Get("repair-requests/technicians/:technicianId")
  @Permissions("RA_PERM_VIEW_REPAIR")
  @ApiOperation({
    summary: "Lấy danh sách yêu cầu sửa chữa theo kỹ thuật viên",
    description: `
      Lấy danh sách tất cả yêu cầu sửa chữa được phân công cho một kỹ thuật viên cụ thể.
      
      **Sử dụng khi:**
      - Kỹ thuật viên muốn xem danh sách công việc được phân công
      - Quản lý muốn theo dõi workload của từng kỹ thuật viên
      - Thống kê hiệu suất làm việc theo kỹ thuật viên
      
      **Yêu cầu quyền:** RA_PERM_VIEW_REPAIR
    `,
  })
  @ApiParam({
    name: "technicianId",
    description: "ID của kỹ thuật viên",
    format: "uuid",
    example: "47d9013d-6c7e-48d2-8443-6300632ed811",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách yêu cầu sửa chữa của kỹ thuật viên thành công",
    type: [RepairRequestResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy yêu cầu sửa chữa của kỹ thuật viên",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async getRepairRequestsByTechnician(
    @Param("technicianId", ParseUUIDPipe) technicianId: string
  ): Promise<RepairRequestResponseDto[]> {
    return this.repairsService.findByTechnician(technicianId);
  }

  @Get("repair-requests/reporters/:reporterId")
  @ApiOperation({
    summary: "Lấy danh sách yêu cầu sửa chữa theo người báo lỗi",
    description: `
      Lấy danh sách tất cả yêu cầu sửa chữa do một người dùng cụ thể tạo ra.
      
      **Sử dụng khi:**
      - Người dùng muốn xem lịch sử các yêu cầu sửa chữa của mình
      - Quản trị viên muốn theo dõi yêu cầu của một người dùng cụ thể
      - Thống kê số lượng yêu cầu theo người báo lỗi
      
      **Thông tin trả về:**
      - Danh sách đầy đủ các yêu cầu sửa chữa
      - Bao gồm thông tin tài sản, phòng, kỹ thuật viên và trạng thái
      - Sắp xếp theo thời gian tạo mới nhất
    `,
  })
  @ApiParam({
    name: "reporterId",
    description: "ID của người báo lỗi",
    format: "uuid",
    example: "47d9013d-6c7e-48d2-8443-6300632ed811",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách yêu cầu sửa chữa thành công",
    type: [RepairRequestResponseDto],
    schema: {
      example: [
        {
          id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          requestCode: "YCSC-2025-0001",
          computerAssetId: "asset-123",
          computerAsset: {
            id: "asset-123",
            ktCode: "4A01-01-PC-001",
            name: "Máy tính phòng 4A01.01",
            type: "DESKTOP",
            status: "DAMAGED",
          },
          room: {
            id: "room-123",
            name: "Phòng 4A01.01",
            building: "A",
            floor: "1",
            roomNumber: "4A01.01",
          },
          reporterId: "47d9013d-6c7e-48d2-8443-6300632ed811",
          reporter: {
            id: "47d9013d-6c7e-48d2-8443-6300632ed811",
            fullName: "Nguyễn Văn A",
            email: "nguyenvana@fit.hcmuaf.edu.vn",
            username: "21011111",
          },
          description: "Máy không khởi động, không có tín hiệu màn hình",
          errorType: "MAY_KHONG_KHOI_DONG",
          status: "ĐANG_XỬ_LÝ",
          assignedTechnicianId: "tech-123",
          assignedTechnician: {
            id: "tech-123",
            fullName: "Trần Thị B",
            email: "tranthib@fit.hcmuaf.edu.vn",
            username: "21011112",
          },
          createdAt: "2025-11-04T10:00:00Z",
          acceptedAt: "2025-11-04T10:30:00Z",
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy người dùng hoặc không có yêu cầu nào",
    schema: {
      example: {
        statusCode: 404,
        message:
          "Không tìm thấy người dùng với ID: 47d9013d-6c7e-48d2-8443-6300632ed811",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async getRepairRequestsByReporter(
    @Param("reporterId", ParseUUIDPipe) reporterId: string
  ): Promise<RepairRequestResponseDto[]> {
    return this.repairsService.findByReporter(reporterId);
  }

  @Get("technician/assigned-floors")
  @ApiOperation({
    summary: "Lấy danh sách tầng được phân công cho kỹ thuật viên",
    description: `
      Lấy danh sách các tầng tòa nhà được phân công cho kỹ thuật viên hiện tại.
      
      **Quyền hạn:**
      - Kỹ thuật viên: Chỉ xem tầng được phân công trong bảng technician_assignments
      - Admin/Tổ trưởng: Xem tất cả tầng tòa nhà
      
      **Sử dụng khi:**
      - Hiển thị danh sách tầng có thể báo lỗi
      - Filter rooms theo tầng được phân công
      - Kiểm tra phạm vi công việc của kỹ thuật viên
    `,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách tầng được phân công thành công",
    schema: {
      example: {
        assignedFloors: [
          {
            building: "B",
            floor: "1",
            pendingRequests: 3,
            inProgressRequests: 2,
            waitingReplacementRequests: 1,
          },
          {
            building: "B",
            floor: "2",
            pendingRequests: 1,
            inProgressRequests: 0,
            waitingReplacementRequests: 0,
          },
        ],
        totalAssignedFloors: 2,
        totalPendingRequests: 4,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền xem danh sách tầng được phân công",
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async getAssignedFloors(@CurrentUser() user: User) {
    return this.repairsService.getAssignedFloors(user);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Xóa yêu cầu sửa chữa",
    description: `
      Xóa một yêu cầu sửa chữa khỏi hệ thống.
      
      **Quyền hạn:**
      - Người báo lỗi (reporter): Chỉ có thể xóa yêu cầu của mình khi trạng thái là CHỜ_TIẾP_NHẬN
      - Admin/Tổ trưởng kỹ thuật: Có thể xóa bất kỳ yêu cầu nào
      
      **Quy trình xóa:**
      1. Kiểm tra quyền xóa của người dùng
      2. Kiểm tra yêu cầu có đang liên kết với đề xuất thay thế không
      3. Xóa tất cả repair logs liên quan
      4. Xóa yêu cầu sửa chữa (repair_request_components tự động xóa do CASCADE)
      5. Cập nhật trạng thái asset nếu không còn yêu cầu sửa chữa nào và không còn component lỗi
      
      **Lưu ý:**
      - Không thể xóa yêu cầu đang liên kết với đề xuất thay thế (replacement proposal)
      - Sau khi xóa, nếu asset không còn yêu cầu sửa chữa nào và không còn component lỗi, 
        trạng thái asset sẽ tự động chuyển từ DAMAGED về IN_USE
      - Tất cả repair logs sẽ bị xóa vĩnh viễn
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của yêu cầu sửa chữa cần xóa",
    format: "uuid",
    example: "8f0d400e-74f5-4415-a668-3eb37137bda1",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Xóa yêu cầu sửa chữa thành công",
    schema: {
      example: {
        message: "Xóa yêu cầu sửa chữa YCSC-2025-0001 thành công",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy yêu cầu sửa chữa",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy yêu cầu sửa chữa với ID: xxx",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền xóa yêu cầu này",
    schema: {
      example: {
        statusCode: 403,
        message:
          "Bạn không có quyền xóa yêu cầu sửa chữa này. Chỉ có thể xóa yêu cầu ở trạng thái CHỜ_TIẾP_NHẬN hoặc bạn phải là Admin/Tổ trưởng.",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Yêu cầu đang liên kết với đề xuất thay thế",
    schema: {
      example: {
        statusCode: 400,
        message:
          "Không thể xóa yêu cầu sửa chữa này vì đang liên kết với các đề xuất thay thế: DXTT-2025-0001 (ĐÃ_DUYỆT). Vui lòng hủy liên kết hoặc xóa các đề xuất trước.",
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
    return this.repairsService.remove(id, user);
  }
}
