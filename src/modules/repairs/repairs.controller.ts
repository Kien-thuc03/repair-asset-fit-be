import {
  Controller,
  Post,
  Get,
  Put,
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
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";

@ApiTags("Repairs")
@Controller("api/v1/repairs")
@UseGuards(JwtAuthGuard)
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

  @Put(":id/start-processing")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Bắt đầu xử lý sửa chữa",
    description: `
      Bắt đầu quá trình sửa chữa thực tế, chuyển trạng thái sang ĐANG_XỬ_LÝ.
      
      **Quyền hạn:**
      - Kỹ thuật viên được phân công: Có thể bắt đầu xử lý
      - Tổ trưởng Kỹ thuật: Có thể bắt đầu cho bất kỳ yêu cầu nào
      - Trưởng phòng quản trị: Có thể bắt đầu bất kỳ lúc nào
      
      **Điều kiện:**
      - Yêu cầu phải ở trạng thái ĐÃ_TIẾP_NHẬN
      - Phải đã có kỹ thuật viên được phân công
      - Tài sản phải ở trạng thái có thể sửa chữa
      
      **Quy trình sau khi bắt đầu:**
      - Tạo log bắt đầu xử lý
      - Có thể cập nhật thông tin chẩn đoán
      - Có thể báo cáo tiến độ xử lý
      - Có thể yêu cầu thay thế linh kiện nếu cần
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của yêu cầu sửa chữa cần bắt đầu xử lý",
    format: "uuid",
    example: "8f0d400e-74f5-4415-a668-3eb37137bda1",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        processingNotes: {
          type: "string",
          description: "Ghi chú khi bắt đầu xử lý (tùy chọn)",
          example:
            "Bắt đầu kiểm tra hệ thống nguồn điện và mainboard. Dự kiến thời gian xử lý 2-3 tiếng.",
          maxLength: 1000,
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Bắt đầu xử lý sửa chữa thành công",
    type: RepairRequestResponseDto,
    schema: {
      example: {
        id: "8f0d400e-74f5-4415-a668-3eb37137bda1",
        requestCode: "YCSC-2025-0006",
        status: "ĐANG_XỬ_LÝ",
        assignedTechnician: {
          id: "47d9013d-6c7e-48d2-8443-6300632ed811",
          username: "21011111",
        },
        processingStartedAt: "2025-10-23T11:15:30.456Z",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Không thể bắt đầu xử lý",
    schema: {
      examples: {
        "wrong-status": {
          summary: "Trạng thái không hợp lệ",
          value: {
            statusCode: 400,
            message:
              "Chỉ có thể bắt đầu xử lý khi yêu cầu ở trạng thái ĐÃ_TIẾP_NHẬN",
            error: "Bad Request",
          },
        },
        "no-technician": {
          summary: "Chưa có kỹ thuật viên",
          value: {
            statusCode: 400,
            message: "Yêu cầu chưa được phân công kỹ thuật viên",
            error: "Bad Request",
          },
        },
        "asset-unavailable": {
          summary: "Tài sản không khả dụng",
          value: {
            statusCode: 400,
            message: "Tài sản đang bị khóa hoặc không thể truy cập",
            error: "Bad Request",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền bắt đầu xử lý",
    schema: {
      examples: {
        "not-assigned": {
          summary: "Không được phân công",
          value: {
            statusCode: 403,
            message:
              "Bạn không phải là kỹ thuật viên được phân công cho yêu cầu này",
            error: "Forbidden",
          },
        },
        "insufficient-permission": {
          summary: "Không đủ quyền hạn",
          value: {
            statusCode: 403,
            message: "Bạn không có quyền bắt đầu xử lý yêu cầu sửa chữa",
            error: "Forbidden",
          },
        },
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
  async start(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() startDto: StartProcessingDto,
    @CurrentUser() user: User
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.startProcessing(id, startDto, user);
  }

  @Put(":id/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Hoàn thành sửa chữa",
    description: `
      Hoàn thành yêu cầu sửa chữa, chuyển trạng thái sang ĐÃ_HOÀN_THÀNH.
      
      **Quyền hạn:**
      - Kỹ thuật viên được phân công: Có thể hoàn thành yêu cầu của mình
      - Tổ trưởng Kỹ thuật: Có thể hoàn thành bất kỳ yêu cầu nào
      - Trưởng phòng quản trị: Có thể hoàn thành bất kỳ lúc nào
      
      **Điều kiện:**
      - Trạng thái hiện tại phải là ĐANG_XỬ_LÝ hoặc CHỜ_THAY_THẾ
      - Phải có ghi chú kết quả xử lý chi tiết
      - Tài sản phải được kiểm tra và xác nhận hoạt động tốt
      
      **Sau khi hoàn thành:**
      - Tự động cập nhật completedAt timestamp
      - Cập nhật trạng thái tài sản về IN_USE (nếu sửa thành công)
      - Ghi log hoàn thành vào RepairLogs
      - Có thể gửi thông báo cho người báo lỗi
      - Có thể tạo báo cáo tổng kết (nếu cần)
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của yêu cầu sửa chữa cần hoàn thành",
    format: "uuid",
    example: "8f0d400e-74f5-4415-a668-3eb37137bda1",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        resolutionNotes: {
          type: "string",
          description: "Ghi chú kết quả xử lý chi tiết (bắt buộc)",
          example:
            "Đã thay thế nguồn điện 500W Cooler Master MWE Bronze V2. Kiểm tra tất cả kết nối, test khởi động và chạy stress test 30 phút. Máy hoạt động ổn định, nhiệt độ bình thường. Đã bàn giao lại cho người dùng kèm hướng dẫn bảo trì cơ bản.",
          minLength: 20,
          maxLength: 2000,
        },
        actualCost: {
          type: "number",
          description: "Chi phí thực tế phát sinh (tùy chọn)",
          example: 850000,
          minimum: 0,
        },
        replacedComponents: {
          type: "array",
          description: "Danh sách linh kiện đã thay thế (tùy chọn)",
          items: {
            type: "string",
          },
          example: ["Nguồn điện 500W", "Cáp SATA"],
        },
        isSuccessful: {
          type: "boolean",
          description: "Sửa chữa có thành công hay không",
          example: true,
          default: true,
        },
      },
      required: ["resolutionNotes"],
      examples: [
        {
          summary: "Sửa chữa thành công - Thay nguồn điện",
          value: {
            resolutionNotes:
              "Đã thay thế nguồn điện 500W Cooler Master MWE Bronze V2. Kiểm tra tất cả kết nối, test khởi động và chạy stress test 30 phút. Máy hoạt động ổn định, nhiệt độ bình thường. Đã bàn giao lại cho người dùng kèm hướng dẫn bảo trì cơ bản.",
            actualCost: 850000,
            replacedComponents: ["Nguồn điện 500W Cooler Master MWE Bronze V2"],
            isSuccessful: true,
          },
        },
        {
          summary: "Sửa chữa thành công - Sửa phần mềm",
          value: {
            resolutionNotes:
              "Đã gỡ cài đặt hoàn toàn Microsoft Office 2021 bằng Office Removal Tool. Tải và cài đặt lại Office 2021 từ trang chủ Microsoft. Cập nhật tất cả các bản vá mới nhất. Kiểm tra Word, Excel, PowerPoint đều hoạt động bình thường. Đã tạo shortcut mới và test với file mẫu.",
            actualCost: 0,
            replacedComponents: [],
            isSuccessful: true,
          },
        },
        {
          summary: "Không thể sửa chữa",
          value: {
            resolutionNotes:
              "Đã kiểm tra chi tiết mainboard và CPU. Xác định mainboard bị cháy chip điều khiển nguồn, không thể sửa chữa. Chi phí thay thế mainboard mới (8.5 triệu) cao hơn giá trị tài sản. Đề xuất thanh lý và mua máy mới.",
            actualCost: 200000,
            replacedComponents: [],
            isSuccessful: false,
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Hoàn thành sửa chữa thành công",
    type: RepairRequestResponseDto,
    schema: {
      example: {
        id: "8f0d400e-74f5-4415-a668-3eb37137bda1",
        requestCode: "YCSC-2025-0006",
        status: "ĐÃ_HOÀN_THÀNH",
        completedAt: "2025-10-23T14:30:45.789Z",
        resolutionNotes:
          "Đã thay thế nguồn điện 500W, máy hoạt động bình thường",
        assignedTechnician: {
          id: "47d9013d-6c7e-48d2-8443-6300632ed811",
          username: "21011111",
        },
        computerAsset: {
          id: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          status: "IN_USE",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Không thể hoàn thành sửa chữa",
    schema: {
      examples: {
        "wrong-status": {
          summary: "Trạng thái không hợp lệ",
          value: {
            statusCode: 400,
            message:
              "Chỉ có thể hoàn thành yêu cầu ở trạng thái ĐANG_XỬ_LÝ hoặc CHỜ_THAY_THẾ",
            error: "Bad Request",
          },
        },
        "missing-notes": {
          summary: "Thiếu ghi chú xử lý",
          value: {
            statusCode: 400,
            message: "Ghi chú kết quả xử lý là bắt buộc khi hoàn thành",
            error: "Bad Request",
          },
        },
        "validation-error": {
          summary: "Lỗi validation",
          value: {
            statusCode: 400,
            message: [
              "Ghi chú kết quả xử lý phải có ít nhất 20 ký tự",
              "Chi phí không được âm",
            ],
            error: "Bad Request",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền hoàn thành",
    schema: {
      examples: {
        "not-assigned": {
          summary: "Không được phân công",
          value: {
            statusCode: 403,
            message:
              "Bạn không phải là kỹ thuật viên được phân công cho yêu cầu này",
            error: "Forbidden",
          },
        },
        "insufficient-permission": {
          summary: "Không đủ quyền hạn",
          value: {
            statusCode: 403,
            message: "Bạn không có quyền hoàn thành yêu cầu sửa chữa",
            error: "Forbidden",
          },
        },
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
  async complete(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: {
      resolutionNotes: string;
      actualCost?: number;
      replacedComponents?: string[];
      isSuccessful?: boolean;
    },
    @CurrentUser() user: User
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.completeRequest(id, body.resolutionNotes, user);
  }

  @Put(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Hủy yêu cầu sửa chữa",
    description: `
      Hủy một yêu cầu sửa chữa, chuyển trạng thái sang ĐÃ_HỦY.
      
      **Quyền hạn:**
      - Người báo lỗi: Chỉ có thể hủy khi CHỜ_TIẾP_NHẬN
      - Kỹ thuật viên được phân công: Có thể hủy khi ĐANG_XỬ_LÝ với lý do hợp lý
      - Tổ trưởng Kỹ thuật: Có thể hủy bất kỳ lúc nào (trừ ĐÃ_HOÀN_THÀNH)
      - Trưởng phòng quản trị: Có thể hủy bất kỳ lúc nào (trừ ĐÃ_HOÀN_THÀNH)
      
      **Điều kiện hủy:**
      - Không thể hủy yêu cầu đã hoàn thành (ĐÃ_HOÀN_THÀNH)
      - Phải cung cấp lý do hủy chi tiết và hợp lý
      - Nếu đang CHỜ_THAY_THẾ, cần xác nhận hủy đơn hàng linh kiện
      
      **Sau khi hủy:**
      - Cập nhật trạng thái tài sản về trạng thái ban đầu
      - Ghi log hủy yêu cầu với lý do
      - Thông báo cho các bên liên quan
      - Thao tác này không thể hoàn tác
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của yêu cầu sửa chữa cần hủy",
    format: "uuid",
    example: "8f0d400e-74f5-4415-a668-3eb37137bda1",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        cancelReason: {
          type: "string",
          description: "Lý do hủy yêu cầu chi tiết (bắt buộc)",
          example:
            "Người dùng đã tự khắc phục sự cố bằng cách kiểm tra và cắm lại dây nguồn. Máy hoạt động bình thường.",
          minLength: 10,
          maxLength: 500,
        },
        refundAmount: {
          type: "number",
          description: "Số tiền cần hoàn lại (nếu có)",
          example: 0,
          minimum: 0,
        },
        notifyUser: {
          type: "boolean",
          description: "Có thông báo cho người dùng không",
          example: true,
          default: true,
        },
      },
      required: ["cancelReason"],
      examples: [
        {
          summary: "Người dùng tự khắc phục",
          value: {
            cancelReason:
              "Người dùng đã tự khắc phục sự cố bằng cách kiểm tra và cắm lại dây nguồn. Máy hoạt động bình thường.",
            refundAmount: 0,
            notifyUser: true,
          },
        },
        {
          summary: "Không thể sửa chữa - Chi phí quá cao",
          value: {
            cancelReason:
              "Sau khi kiểm tra chi tiết, chi phí sửa chữa (12 triệu đồng) vượt quá 80% giá trị tài sản. Đề xuất thanh lý và mua thiết bị mới thay thế.",
            refundAmount: 500000,
            notifyUser: true,
          },
        },
        {
          summary: "Yêu cầu trùng lặp",
          value: {
            cancelReason:
              "Phát hiện yêu cầu trùng lặp với YCSC-2025-0003 cho cùng một tài sản. Hủy để tránh xử lý trùng lặp.",
            refundAmount: 0,
            notifyUser: false,
          },
        },
        {
          summary: "Tài sản đã thanh lý",
          value: {
            cancelReason:
              "Tài sản đã được đưa vào danh sách thanh lý theo quyết định số 123/QĐ-ĐHCN ngày 20/10/2025. Không thể tiếp tục sửa chữa.",
            refundAmount: 0,
            notifyUser: true,
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Hủy yêu cầu sửa chữa thành công",
    type: RepairRequestResponseDto,
    schema: {
      example: {
        id: "8f0d400e-74f5-4415-a668-3eb37137bda1",
        requestCode: "YCSC-2025-0006",
        status: "ĐÃ_HỦY",
        cancelledAt: "2025-10-23T15:45:30.123Z",
        cancelReason: "Người dùng đã tự khắc phục sự cố",
        cancelledBy: {
          id: "a949c9da-d9b4-43b1-82f4-9dd3250a749d",
          username: "21012345",
        },
        computerAsset: {
          id: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          status: "IN_USE",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Không thể hủy yêu cầu",
    schema: {
      examples: {
        "already-completed": {
          summary: "Đã hoàn thành",
          value: {
            statusCode: 400,
            message: "Không thể hủy yêu cầu đã hoàn thành",
            error: "Bad Request",
          },
        },
        "invalid-reason": {
          summary: "Lý do hủy không hợp lệ",
          value: {
            statusCode: 400,
            message: "Lý do hủy phải có ít nhất 10 ký tự",
            error: "Bad Request",
          },
        },
        "pending-replacement": {
          summary: "Đang chờ thay thế",
          value: {
            statusCode: 400,
            message:
              "Yêu cầu đang chờ thay thế linh kiện. Vui lòng xác nhận hủy đơn hàng trước khi hủy yêu cầu.",
            error: "Bad Request",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền hủy yêu cầu",
    schema: {
      examples: {
        "not-owner": {
          summary: "Không phải chủ yêu cầu",
          value: {
            statusCode: 403,
            message:
              "Bạn chỉ có thể hủy yêu cầu do mình tạo và ở trạng thái CHỜ_TIẾP_NHẬN",
            error: "Forbidden",
          },
        },
        "insufficient-permission": {
          summary: "Không đủ quyền hạn",
          value: {
            statusCode: 403,
            message: "Bạn không có quyền hủy yêu cầu sửa chữa này",
            error: "Forbidden",
          },
        },
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
  async cancel(
    @Param("id", ParseUUIDPipe) id: string,
    @Body()
    body: { cancelReason: string; refundAmount?: number; notifyUser?: boolean },
    @CurrentUser() user: User
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.cancelRequest(id, body.cancelReason, user);
  }
}
