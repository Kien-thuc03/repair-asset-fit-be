import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { ComputerService } from "./computer.service";
import { CreateComputerDto } from "./dto/create-computer.dto";
import { UpdateComputerDto } from "./dto/update-computer.dto";
import { AvailableComponentsFilterDto } from "./dto/available-components-filter.dto";
import { GetComputersFilterDto, GetComputersResponseDto } from "./dto/get-computers-filter.dto";
import { GetComputerDetailResponseDto } from "./dto/get-computer-detail-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "../../entities/user.entity";

@ApiTags("Computer & Components")
@Controller("computer")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ComputerController {
  constructor(private readonly computerService: ComputerService) {}

  /**
   * GET /computer/room/:roomId
   * Lấy tất cả máy tính trong một phòng cụ thể
   *
   * @param roomId - UUID của phòng
   * @returns Danh sách máy tính kèm thông tin asset, room và components
   */
  @Get("room/:roomId")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Lấy tất cả máy tính trong một phòng cụ thể",
    description: "API lấy tất cả máy tính trong một phòng cụ thể theo roomId.",
  })
  getComputersByRoom(@Param("roomId") roomId: string) {
    return this.computerService.getComputersByRoom(roomId);
  }

  /**
   * GET /computer/:id
   * Lấy thông tin chi tiết đầy đủ của một máy tính
   * Bao gồm: asset, room, components, software, repair summary
   *
   * @param id - UUID của máy tính hoặc Asset ID
   * @returns Thông tin chi tiết đầy đủ của máy tính
   */
  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Lấy thông tin chi tiết đầy đủ của một máy tính",
    description: `
      API lấy thông tin chi tiết đầy đủ của một máy tính theo Computer ID hoặc Asset ID.
      
      **Thông tin trả về:**
      - **Computer**: ID, số máy, ghi chú
      - **Asset**: Mã KT, mã TSCĐ, tên, thông số, trạng thái, ngày nhập, xuất xứ, danh mục
      - **Room**: Tên phòng, mã phòng, tòa nhà, tầng, đơn vị
      - **Components**: Danh sách linh kiện (loại, tên, thông số, serial, trạng thái, ngày lắp đặt)
      - **Software**: Danh sách phần mềm (tên, version, publisher, license, ngày cài đặt)
      - **Repair Summary**: Thống kê lịch sử sửa chữa (tổng số, đang xử lý, hoàn thành)
      
      **Đặc điểm:**
      - Hỗ trợ tìm kiếm bằng Computer ID hoặc Asset ID
      - Tự động join tất cả quan hệ cần thiết
      - Sắp xếp components theo loại và ngày lắp đặt
      - Sắp xếp software theo ngày cài đặt
      - Tính toán thống kê repair requests
      
      **Use cases:**
      - Xem chi tiết máy tính trong giao diện quản lý thiết bị
      - Kiểm tra thông tin đầy đủ trước khi bảo trì/sửa chữa
      - Xem lịch sử phần mềm và linh kiện của máy tính
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Lấy thông tin chi tiết máy tính thành công",
    type: GetComputerDetailResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy máy tính với ID được cung cấp",
  })
  @ApiResponse({
    status: 401,
    description: "Chưa xác thực",
  })
  getComputerDetail(@Param("id") id: string) {
    return this.computerService.getComputerDetail(id);
  }

  /**
   * GET /computer
   * Lấy danh sách máy tính với filter và pagination
   * Dành cho giao diện quản lý thiết bị của kỹ thuật viên
   *
   * @param filterDto - Query parameters cho filter và pagination
   * @returns Danh sách máy tính với thông tin đầy đủ, pagination và summary
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Lấy danh sách máy tính với filter và pagination",
    description: `
      API lấy danh sách máy tính với đầy đủ thông tin cho giao diện quản lý thiết bị.
      
      **Thông tin trả về:**
      - Thông tin tài sản (asset): ID, mã KT, mã TSCĐ, tên, thông số, trạng thái, ngày nhập, xuất xứ
      - Thông tin phòng (room): ID, tên, số phòng, mã phòng, tòa nhà, tầng
      - Danh sách linh kiện (components): Loại, tên, thông số, serial, trạng thái, ngày lắp đặt
      - Thống kê: Tổng số máy tính, phân bổ theo trạng thái
      
      **Filter hỗ trợ:**
      - Tìm kiếm theo tên, mã KT, mã TSCĐ, số máy
      - Lọc theo trạng thái tài sản (IN_USE, DAMAGED, etc.)
      - Lọc theo tòa nhà, tầng, phòng
      - Lọc theo danh mục
      - Sắp xếp theo nhiều tiêu chí
      - Phân trang linh hoạt (mặc định: page=1, limit=12)
      
      **Lưu ý:**
      - Nếu không truyền query params, sẽ trả về trang đầu tiên với 12 items
      - Có thể kết hợp nhiều filter cùng lúc
      - Summary statistics luôn tính trên toàn bộ dữ liệu (không bị ảnh hưởng bởi filter)
    `,
  })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách máy tính thành công",
    type: GetComputersResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Chưa xác thực",
  })
  getComputersWithFilter(@Query() filterDto: GetComputersFilterDto) {
    return this.computerService.getComputersWithFilter(filterDto);
  }

  /**
   * GET /computer/:computerId/components
   * Lấy tất cả components của một máy tính cụ thể
   *
   * @param computerId - UUID của máy tính
   * @returns Danh sách components của máy tính
   */
  @Get(":computerId/components")
  @HttpCode(HttpStatus.OK)
  getComponentsByComputer(@Param("computerId") computerId: string) {
    return this.computerService.getComponentsByComputer(computerId);
  }

  /**
   * GET /computer/asset/:assetId/components
   * Lấy tất cả components của một tài sản máy tính (theo Asset ID)
   *
   * @param assetId - UUID của tài sản
   * @returns Danh sách components của máy tính
   */
  @Get("asset/:assetId/components")
  @HttpCode(HttpStatus.OK)
  getComponentsByAssetId(@Param("assetId") assetId: string) {
    return this.computerService.getComponentsByAssetId(assetId);
  }

  @Get("current-user/available-components")
  @ApiOperation({
    summary: "Lấy danh sách linh kiện khả dụng từ yêu cầu sửa chữa để lập đề xuất thay thế",
    description: `
      Lấy danh sách các linh kiện từ các yêu cầu sửa chữa mà kỹ thuật viên hiện tại đảm nhận để lập đề xuất thay thế.
      
      **Mục đích:**
      - Hiển thị danh sách linh kiện cần thay thế từ các yêu cầu sửa chữa mà kỹ thuật viên được phân công
      - Kỹ thuật viên chỉ thấy các yêu cầu sửa chữa do mình xử lý (assignedTechnicianId)
      - Kỹ thuật viên có thể chọn nhiều linh kiện để tạo đề xuất thay thế hàng loạt
      - Tự động lọc ra các linh kiện đã có trong đề xuất (tránh trùng lặp)
      
      **Dữ liệu trả về bao gồm:**
      - Thông tin linh kiện (ID, tên, loại, thông số kỹ thuật)
      - Thông tin tài sản (máy tính) chứa linh kiện
      - Vị trí (tòa nhà, phòng, số máy)
      - Thông tin yêu cầu sửa chữa (mã, trạng thái, mô tả)
      
      **Tính năng lọc:**
      - Tìm kiếm theo mã YCSC (requestCode)
      - Theo loại linh kiện (CPU, RAM, GPU, v.v.)
      - Tìm kiếm theo tên linh kiện, tài sản, mã tài sản
      - Theo vị trí (tòa nhà, tầng, phòng)
      - Loại trừ linh kiện đã có trong đề xuất (mặc định: true)
      - **⚠️ Chỉ lấy components có status = FAULTY (tự động filter)**
      - **Tự động lọc theo kỹ thuật viên hiện tại (từ JWT token)**
      - **Tự động lọc theo repair status (ĐÃ_TIẾP_NHẬN, ĐANG_XỬ_LÝ) - không cho phép override**
    `,
  })
  @ApiQuery({
    name: "requestCode",
    required: false,
    description: "Tìm kiếm theo mã YCSC",
    type: String,
    example: "YCSC-2025-0001",
  })
  @ApiQuery({
    name: "componentType",
    required: false,
    description: "Lọc theo loại linh kiện (có thể truyền nhiều giá trị)",
    isArray: true,
    enum: ["CPU", "RAM", "GPU", "STORAGE", "MAINBOARD", "PSU", "COOLER", "MONITOR", "KEYBOARD", "MOUSE", "NETWORK_CARD", "SOUND_CARD", "OTHER"],
    example: ["RAM", "CPU"],
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Tìm kiếm theo tên linh kiện, tài sản, mã tài sản",
    type: String,
  })
  @ApiQuery({
    name: "building",
    required: false,
    description: "Lọc theo tòa nhà",
    type: String,
    example: "A",
  })
  @ApiQuery({
    name: "floor",
    required: false,
    description: "Lọc theo tầng",
    type: String,
    example: "1",
  })
  @ApiQuery({
    name: "roomName",
    required: false,
    description: "Lọc theo phòng",
    type: String,
    example: "A01.03",
  })
  @ApiQuery({
    name: "excludeInProposal",
    required: false,
    description: "Loại trừ linh kiện đã có trong đề xuất",
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (từ 1)",
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng mỗi trang",
    type: Number,
    example: 10,
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    description: "Sắp xếp theo trường",
    enum: ["createdAt", "componentName", "requestCode"],
    example: "createdAt",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    description: "Thứ tự sắp xếp",
    enum: ["ASC", "DESC"],
    example: "DESC",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách linh kiện khả dụng thành công",
    schema: {
      example: {
        data: [
          {
            repairRequestId: "fda02b10-3ca8-4a17-9c16-97f3ca753ba4",
            requestCode: "YCSC-2025-0002",
            repairStatus: "ĐÃ_TIẾP_NHẬN",
            repairDescription: "Chuột không hoạt động",
            componentId: "35560238-96ec-4242-9e17-be3a0e3b23cc",
            componentName: "Logitech MX Master 3",
            componentType: "MOUSE",
            componentSpecs: "Wireless Mouse 4000 DPI",
            assetId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
            assetName: "PC ASUS VivoBook",
            ktCode: "19-0210/01",
            roomName: "A01.03",
            buildingName: "A",
            floor: "1",
            machineLabel: "01",
            createdAt: "2025-11-07T10:30:00.000Z",
          },
        ],
        total: 15,
        page: 1,
        limit: 10,
        totalPages: 2,
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async getAvailableComponents(
    @Query() filter: AvailableComponentsFilterDto,
    @CurrentUser() user: User
  ) {
    return this.computerService.getAvailableComponents(filter, user);
  }
}
