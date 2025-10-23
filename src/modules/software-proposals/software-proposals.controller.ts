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
      
      **Quyền hạn theo role:**
      - **Người tạo đề xuất**: Có thể cập nhật khi CHỜ_DUYỆT (thông tin phòng, lý do)
      - **Kỹ thuật viên**: Có thể cập nhật trạng thái (duyệt, từ chối, đánh dấu đã trang bị)
      - **Admin**: Có thể cập nhật bất kỳ lúc nào
      
      **Quy trình chuyển trạng thái:**
      - CHỜ_DUYỆT → ĐÃ_DUYỆT (Kỹ thuật viên duyệt đề xuất)
      - CHỜ_DUYỆT → ĐÃ_TỪ_CHỐI (Kỹ thuật viên từ chối)
      - ĐÃ_DUYỆT → ĐÃ_TRANG_BỊ (Kỹ thuật viên đánh dấu đã cài đặt xong)
      - ĐÃ_TỪ_CHỐI → CHỜ_DUYỆT (Có thể gửi lại đề xuất)
      
      **Lưu ý:**
      - Khi cập nhật status thành ĐÃ_DUYỆT, ĐÃ_TỪ_CHỐI, hoặc ĐÃ_TRANG_BỊ, approverId sẽ tự động được set
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
        summary: "Người tạo: Thay đổi phòng máy",
        description:
          "Người tạo đề xuất có thể thay đổi thông tin khi CHỜ_DUYỆT",
        value: {
          roomId: "new-room-id",
          reason: "Lý do đã được cập nhật",
        },
      },
      approve: {
        summary: "Kỹ thuật viên: Duyệt đề xuất",
        description: "Kỹ thuật viên duyệt đề xuất phần mềm",
        value: {
          status: "ĐÃ_DUYỆT",
        },
      },
      reject: {
        summary: "Kỹ thuật viên: Từ chối đề xuất",
        description: "Kỹ thuật viên từ chối đề xuất với lý do",
        value: {
          status: "ĐÃ_TỪ_CHỐI",
        },
      },
      "mark-equipped": {
        summary: "Kỹ thuật viên: Đánh dấu đã trang bị",
        description: "Kỹ thuật viên đánh dấu đã cài đặt phần mềm xong",
        value: {
          status: "ĐÃ_TRANG_BỊ",
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
    status: HttpStatus.BAD_REQUEST,
    description: "Chuyển trạng thái không hợp lệ",
    schema: {
      example: {
        statusCode: 400,
        message: "Không thể chuyển từ trạng thái ĐÃ_TRANG_BỊ sang CHỜ_DUYỆT",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền cập nhật",
    schema: {
      examples: {
        "not-owner": {
          summary: "Không phải người tạo",
          value: {
            statusCode: 403,
            message: "Bạn không có quyền cập nhật đề xuất này",
            error: "Forbidden",
          },
        },
        "insufficient-permission": {
          summary: "Không đủ quyền chuyển trạng thái",
          value: {
            statusCode: 403,
            message:
              "Kỹ thuật viên không có quyền thực hiện chuyển đổi trạng thái này",
            error: "Forbidden",
          },
        },
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
}
