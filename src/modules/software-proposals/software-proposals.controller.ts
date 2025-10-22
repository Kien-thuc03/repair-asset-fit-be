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
import { SoftwareProposalsService } from "./software-proposals.service";
import { CreateSoftwareProposalDto } from "./dto/create-software-proposal.dto";
import { UpdateSoftwareProposalDto } from "./dto/update-software-proposal.dto";
import { SoftwareProposalFilterDto } from "./dto/software-proposal-filter.dto";
import { SoftwareProposalResponseDto } from "./dto/software-proposal-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";

@ApiTags("Software Proposals")
@Controller("api/v1/software-proposals")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SoftwareProposalsController {
  constructor(
    private readonly softwareProposalsService: SoftwareProposalsService
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Tạo đề xuất phần mềm mới",
    description: `
      Tạo một đề xuất mua/trang bị phần mềm mới cho phòng máy.
      
      **Quy trình:**
      1. Kiểm tra phòng có tồn tại và hợp lệ
      2. Tự động sinh mã đề xuất (DXPM-YYYY-NNNN)
      3. Tạo đề xuất với trạng thái CHỜ_DUYỆT
      4. Tạo danh sách phần mềm cần đề xuất (có thể nhiều phần mềm cùng lúc)
      5. Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
      
      **Lưu ý:**
      - Người dùng hiện tại (từ JWT token) sẽ được ghi nhận là người tạo đề xuất
      - Có thể đề xuất nhiều phần mềm khác nhau trong cùng một đề xuất
      - Mỗi phần mềm có thể có số lượng license khác nhau
    `,
  })
  @ApiBody({
    type: CreateSoftwareProposalDto,
    examples: {
      "single-software": {
        summary: "Đề xuất một phần mềm",
        description: "Đề xuất Microsoft Office cho phòng máy tính",
        value: {
          roomId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          reason:
            "Phòng máy tính cần Microsoft Office để phục vụ giảng dạy môn Tin học văn phòng cho sinh viên năm nhất",
          items: [
            {
              softwareName: "Microsoft Office 2021 Professional Plus",
              version: "2021",
              publisher: "Microsoft Corporation",
              quantity: 30,
              licenseType: "Vĩnh viễn",
            },
          ],
        },
      },
      "multiple-software": {
        summary: "Đề xuất nhiều phần mềm",
        description: "Đề xuất bộ phần mềm hoàn chỉnh cho phòng thiết kế",
        value: {
          roomId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          reason:
            "Phòng thiết kế đồ họa cần bộ phần mềm chuyên nghiệp để phục vụ giảng dạy và thực hành",
          items: [
            {
              softwareName: "Adobe Photoshop",
              version: "2024",
              publisher: "Adobe Inc.",
              quantity: 25,
              licenseType: "Theo năm",
            },
            {
              softwareName: "Adobe Illustrator",
              version: "2024",
              publisher: "Adobe Inc.",
              quantity: 25,
              licenseType: "Theo năm",
            },
            {
              softwareName: "AutoCAD",
              version: "2024",
              publisher: "Autodesk",
              quantity: 20,
              licenseType: "Theo năm",
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Tạo đề xuất phần mềm thành công",
    type: SoftwareProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Dữ liệu không hợp lệ hoặc phòng không phù hợp",
    schema: {
      example: {
        statusCode: 400,
        message: "Phòng này đã bị xóa, không thể tạo đề xuất phần mềm",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phòng",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy phòng với ID: xxx",
        error: "Not Found",
      },
    },
  })
  async create(
    @Body() createDto: CreateSoftwareProposalDto,
    @CurrentUser() user: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.softwareProposalsService.create(createDto, user);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách đề xuất phần mềm",
    description: `
      Lấy danh sách tất cả đề xuất phần mềm với khả năng lọc và phân trang.
      
      **Tính năng lọc:**
      - Theo phòng (roomId)
      - Theo người tạo (proposerId)
      - Theo người duyệt (approverId)
      - Theo trạng thái (status)
      - Tìm kiếm theo mã đề xuất hoặc lý do (search)
      - Theo khoảng thời gian (fromDate, toDate)
      
      **Phân trang và sắp xếp:**
      - Hỗ trợ phân trang với page và limit
      - Sắp xếp theo createdAt, proposalCode, status
      - Thứ tự ASC hoặc DESC
    `,
  })
  @ApiQuery({
    name: "roomId",
    required: false,
    description: "Lọc theo ID phòng",
  })
  @ApiQuery({
    name: "proposerId",
    required: false,
    description: "Lọc theo ID người tạo",
  })
  @ApiQuery({
    name: "approverId",
    required: false,
    description: "Lọc theo ID người duyệt",
  })
  @ApiQuery({
    name: "status",
    required: false,
    description: "Lọc theo trạng thái",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Tìm kiếm theo mã hoặc lý do",
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
  async findAll(@Query() filter: SoftwareProposalFilterDto) {
    return this.softwareProposalsService.findAll(filter);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Lấy chi tiết đề xuất phần mềm",
    description:
      "Lấy thông tin chi tiết của một đề xuất phần mềm bao gồm danh sách phần mềm, thông tin người tạo, người duyệt và phòng máy.",
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất phần mềm",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy thông tin thành công",
    type: SoftwareProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy đề xuất",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy đề xuất phần mềm với ID: xxx",
        error: "Not Found",
      },
    },
  })
  async findOne(
    @Param("id", ParseUUIDPipe) id: string
  ): Promise<SoftwareProposalResponseDto> {
    return this.softwareProposalsService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({
    summary: "Cập nhật đề xuất phần mềm",
    description: `
      Cập nhật thông tin đề xuất phần mềm.
      
      **Quyền hạn:**
      - Chỉ người tạo đề xuất hoặc admin mới được cập nhật
      - Chỉ được cập nhật khi đang ở trạng thái CHỜ_DUYỆT
      
      **Lưu ý:**
      - Khi cập nhật status thành ĐÃ_DUYỆT hoặc ĐÃ_TỪ_CHỐI, approverId sẽ tự động được set
      - Không thể cập nhật danh sách items qua endpoint này
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất phần mềm",
    format: "uuid",
  })
  @ApiBody({
    type: UpdateSoftwareProposalDto,
    examples: {
      "update-room": {
        summary: "Thay đổi phòng máy",
        value: {
          roomId: "new-room-id",
          reason: "Lý do đã được cập nhật",
        },
      },
      approve: {
        summary: "Duyệt đề xuất",
        value: {
          status: "ĐÃ_DUYỆT",
        },
      },
      reject: {
        summary: "Từ chối đề xuất",
        value: {
          status: "ĐÃ_TỪ_CHỐI",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cập nhật thành công",
    type: SoftwareProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền chỉnh sửa",
    schema: {
      example: {
        statusCode: 403,
        message: "Bạn không có quyền chỉnh sửa đề xuất này",
        error: "Forbidden",
      },
    },
  })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSoftwareProposalDto,
    @CurrentUser() user: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.softwareProposalsService.update(id, updateDto, user);
  }

  @Put(":id/approve")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Duyệt đề xuất phần mềm",
    description: `
      Duyệt một đề xuất phần mềm, chuyển trạng thái từ CHỜ_DUYỆT sang ĐÃ_DUYỆT.
      
      **Quyền hạn:**
      - Cần có quyền duyệt đề xuất (thường là admin hoặc quản lý)
      
      **Sau khi duyệt:**
      - Có thể tiến hành mua phần mềm và cài đặt
      - Có thể đánh dấu "đã trang bị" sau khi hoàn thành
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất phần mềm cần duyệt",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Duyệt đề xuất thành công",
    type: SoftwareProposalResponseDto,
  })
  async approve(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.softwareProposalsService.approve(id, user);
  }

  @Put(":id/reject")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Từ chối đề xuất phần mềm",
    description: `
      Từ chối một đề xuất phần mềm, chuyển trạng thái từ CHỜ_DUYỆT sang ĐÃ_TỪ_CHỐI.
      
      **Quyền hạn:**
      - Cần có quyền duyệt đề xuất (thường là admin hoặc quản lý)
      
      **Sau khi từ chối:**
      - Có thể chỉnh sửa lại đề xuất và gửi lại
      - Hoặc xóa đề xuất nếu không cần thiết
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất phần mềm cần từ chối",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Từ chối đề xuất thành công",
    type: SoftwareProposalResponseDto,
  })
  async reject(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.softwareProposalsService.reject(id, user);
  }

  @Put(":id/mark-equipped")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Đánh dấu đề xuất đã trang bị xong",
    description: `
      Đánh dấu một đề xuất đã được trang bị hoàn tất, chuyển trạng thái từ ĐÃ_DUYỆT sang ĐÃ_TRANG_BỊ.
      
      **Điều kiện:**
      - Đề xuất phải đang ở trạng thái ĐÃ_DUYỆT
      - Đã hoàn thành việc mua và cài đặt phần mềm
      
      **Quy trình thực tế:**
      1. Đề xuất được duyệt (ĐÃ_DUYỆT)
      2. Mua license phần mềm
      3. Cài đặt phần mềm lên các máy tính trong phòng
      4. Đánh dấu "đã trang bị" (ĐÃ_TRANG_BỊ)
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất phần mềm đã hoàn thành trang bị",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Đánh dấu trang bị thành công",
    type: SoftwareProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Đề xuất chưa được duyệt",
    schema: {
      example: {
        statusCode: 400,
        message: "Chỉ có thể đánh dấu trang bị cho đề xuất đã được duyệt",
        error: "Bad Request",
      },
    },
  })
  async markEquipped(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.softwareProposalsService.markEquipped(id, user);
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Xóa đề xuất phần mềm",
    description: `
      Xóa một đề xuất phần mềm và tất cả các items liên quan.
      
      **Quyền hạn:**
      - Chỉ người tạo đề xuất hoặc admin mới được xóa
      
      **Điều kiện:**
      - Chỉ được xóa khi đang ở trạng thái CHỜ_DUYỆT hoặc ĐÃ_TỪ_CHỐI
      - Không thể xóa đề xuất đã được duyệt hoặc đã trang bị
      
      **Lưu ý:**
      - Thao tác này không thể hoàn tác
      - Sẽ xóa cascade tất cả items trong đề xuất
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất phần mềm cần xóa",
    format: "uuid",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Xóa đề xuất thành công",
    schema: {
      example: {
        message: 'Đã xóa đề xuất phần mềm "DXPM-2025-0001" thành công',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền xóa",
    schema: {
      example: {
        statusCode: 403,
        message: "Bạn không có quyền xóa đề xuất này",
        error: "Forbidden",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Không thể xóa do trạng thái không phù hợp",
    schema: {
      example: {
        statusCode: 400,
        message:
          "Chỉ có thể xóa đề xuất ở trạng thái CHỜ_DUYỆT hoặc ĐÃ_TỪ_CHỐI",
        error: "Bad Request",
      },
    },
  })
  async remove(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    return this.softwareProposalsService.remove(id, user);
  }
}
