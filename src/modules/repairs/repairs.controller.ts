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
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách yêu cầu sửa chữa của kỹ thuật viên thành công",
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
}