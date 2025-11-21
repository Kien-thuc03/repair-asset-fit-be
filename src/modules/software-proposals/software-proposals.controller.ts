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
import { CompleteSoftwareProposalDto } from "./dto/complete-software-proposal.dto";
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
      "minimal-required": {
        summary: "Đề xuất tối thiểu (chỉ các trường bắt buộc)",
        description:
          "Ví dụ với chỉ các trường bắt buộc: roomId, reason, softwareName, version",
        value: {
          roomId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          reason: "Phòng máy tính cần Microsoft Office để phục vụ giảng dạy",
          items: [
            {
              softwareName: "Microsoft Office",
              version: "2021",
            },
          ],
        },
      },
      "single-software": {
        summary: "Đề xuất một phần mềm (đầy đủ thông tin)",
        description: "Đề xuất Microsoft Office với đầy đủ thông tin tùy chọn",
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
            },
            {
              softwareName: "Adobe Illustrator",
              version: "2024",
              publisher: "Adobe Inc.",
              quantity: 25,
            },
            {
              softwareName: "AutoCAD",
              version: "2024",
              publisher: "Autodesk",
              quantity: 20,
            },
          ],
        },
      },
      "multiple-software-minimal": {
        summary: "Đề xuất nhiều phần mềm (tối thiểu)",
        description: "Đề xuất nhiều phần mềm chỉ với các trường bắt buộc",
        value: {
          roomId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          reason: "Cần cài đặt phần mềm thiết kế cho phòng máy",
          items: [
            {
              softwareName: "Adobe Photoshop",
              version: "2024",
            },
            {
              softwareName: "Adobe Illustrator",
              version: "2024",
            },
            {
              softwareName: "AutoCAD",
              version: "2024",
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
      - Theo kỹ thuật viên được phân công (technicianId)
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
    name: "technicianId",
    required: false,
    description: "Lọc theo ID kỹ thuật viên được phân công",
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

  @Get("proposals/proposers/:proposerId")
  @ApiOperation({
    summary: "Lấy danh sách đề xuất phần mềm theo người đề xuất",
    description: `
      Lấy danh sách tất cả đề xuất phần mềm do một người dùng cụ thể tạo ra.
      
      **Sử dụng khi:**
      - Người dùng muốn xem lịch sử các đề xuất phần mềm của mình
      - Quản trị viên muốn theo dõi đề xuất của một người dùng cụ thể
      - Thống kê số lượng đề xuất theo người đề xuất
      
      **Thông tin trả về:**
      - Danh sách đầy đủ các đề xuất phần mềm
      - Bao gồm thông tin phòng, danh sách phần mềm và trạng thái
      - Sắp xếp theo thời gian tạo mới nhất
    `,
  })
  @ApiParam({
    name: "proposerId",
    description: "ID của người đề xuất",
    format: "uuid",
    example: "47d9013d-6c7e-48d2-8443-6300632ed811",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách đề xuất phần mềm thành công",
    type: [SoftwareProposalResponseDto],
    schema: {
      example: [
        {
          id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
          proposalCode: "DXPM-2025-0001",
          proposerId: "47d9013d-6c7e-48d2-8443-6300632ed811",
          proposer: {
            id: "47d9013d-6c7e-48d2-8443-6300632ed811",
            fullName: "Nguyễn Văn A",
            email: "nguyenvana@fit.hcmuaf.edu.vn",
            unitName: "Khoa CNTT",
          },
          roomId: "room-123",
          room: {
            id: "room-123",
            name: "Phòng 4A01.01",
            building: "A",
            floor: "1",
            roomNumber: "4A01.01",
          },
          reason: "Phòng máy tính cần Microsoft Office để phục vụ giảng dạy",
          status: "CHỜ_DUYỆT",
          items: [
            {
              id: "item-1",
              softwareName: "Microsoft Office 2021 Professional Plus",
              version: "2021",
              publisher: "Microsoft Corporation",
              quantity: 30,
            },
          ],
          createdAt: "2025-11-04T10:00:00Z",
          updatedAt: "2025-11-04T10:00:00Z",
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy người dùng hoặc không có đề xuất nào",
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
  async getProposalsByProposer(
    @Param("proposerId", ParseUUIDPipe) proposerId: string
  ): Promise<SoftwareProposalResponseDto[]> {
    return this.softwareProposalsService.findByProposer(proposerId);
  }

  @Get("technicians/:technicianId")
  @ApiOperation({
    summary: "Lấy danh sách đề xuất phần mềm theo kỹ thuật viên",
    description: `
      Lấy danh sách đề xuất phần mềm được phân công cho một kỹ thuật viên cụ thể.
      
      **Lưu ý quan trọng:**
      - Chỉ trả về các đề xuất đã được tổ trưởng duyệt
      - Các trạng thái được trả về: ĐÃ_DUYỆT, ĐANG_TRANG_BỊ, ĐÃ_TRANG_BỊ
      - Không trả về các đề xuất đang CHỜ_DUYỆT hoặc ĐÃ_TỪ_CHỐI
      
      **Mục đích:**
      - Kỹ thuật viên có thể xem các đề xuất đã được duyệt và được phân công cho mình
      - Hỗ trợ quản lý và theo dõi công việc của từng kỹ thuật viên
      
      **Trả về:**
      - Danh sách đề xuất phần mềm với đầy đủ thông tin (proposer, approver, room, items)
      - Sắp xếp theo ngày tạo giảm dần (mới nhất trước)
    `,
  })
  @ApiParam({
    name: "technicianId",
    description: "ID của kỹ thuật viên",
    format: "uuid",
    example: "fb8c94eb-9088-4215-be87-0a5736e0b72c",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy danh sách đề xuất thành công",
    type: [SoftwareProposalResponseDto],
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy kỹ thuật viên hoặc không có đề xuất nào",
    schema: {
      example: {
        statusCode: 404,
        message:
          "Không tìm thấy kỹ thuật viên với ID: fb8c94eb-9088-4215-be87-0a5736e0b72c",
        error: "Not Found",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async getProposalsByTechnician(
    @Param("technicianId", ParseUUIDPipe) technicianId: string
  ): Promise<SoftwareProposalResponseDto[]> {
    return this.softwareProposalsService.findByTechnician(technicianId);
  }

  @Put(":id/complete")
  @ApiOperation({
    summary: "Hoàn thành đề xuất phần mềm và cập nhật phần mềm cho các máy tính",
    description: `
      Hoàn thành đề xuất phần mềm và tự động cập nhật phần mềm cho tất cả máy tính trong phòng.
      
      **Quy trình:**
      1. Kỹ thuật viên nhập thông tin phần mềm (tên, version, publisher) nếu cần bổ sung
      2. Hệ thống tạo hoặc cập nhật phần mềm trong bảng Software
      3. Tự động tạo ComputerSoftware records cho tất cả máy tính trong phòng
      4. Cập nhật trạng thái đề xuất sang ĐÃ_TRANG_BỊ
      
      **Yêu cầu:**
      - Đề xuất phải ở trạng thái ĐANG_TRANG_BỊ
      - Chỉ kỹ thuật viên được phân công hoặc admin mới có thể hoàn thành
      - Phòng phải có ít nhất một máy tính
      
      **Lưu ý:**
      - Nếu phần mềm đã tồn tại (có newlyAcquiredSoftwareId), sẽ cập nhật thông tin
      - Nếu phần mềm chưa tồn tại, sẽ tạo mới trong bảng Software
      - Tự động tạo ComputerSoftware cho tất cả máy tính trong phòng
      - Nếu phần mềm đã được cài trên máy tính, sẽ bỏ qua (do unique constraint)
    `,
  })
  @ApiParam({
    name: "id",
    description: "ID của đề xuất phần mềm",
    format: "uuid",
  })
  @ApiBody({
    type: CompleteSoftwareProposalDto,
    examples: {
      "complete-single-software": {
        summary: "Hoàn thành đề xuất với một phần mềm",
        value: {
          softwareInfo: [
            {
              itemId: "123e4567-e89b-12d3-a456-426614174000",
              name: "Microsoft Office 2021 Professional Plus",
              version: "2021",
              publisher: "Microsoft Corporation",
            },
          ],
          completionNotes: "Đã cài đặt thành công trên tất cả máy tính trong phòng",
        },
      },
      "complete-multiple-software": {
        summary: "Hoàn thành đề xuất với nhiều phần mềm",
        value: {
          softwareInfo: [
            {
              itemId: "123e4567-e89b-12d3-a456-426614174000",
              name: "Microsoft Office 2021",
              version: "2021",
              publisher: "Microsoft Corporation",
            },
            {
              itemId: "123e4567-e89b-12d3-a456-426614174001",
              name: "Adobe Photoshop 2024",
              version: "2024",
              publisher: "Adobe Inc.",
            },
          ],
          completionNotes: "Đã cài đặt bộ phần mềm hoàn chỉnh cho phòng thiết kế",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Hoàn thành đề xuất thành công",
    type: SoftwareProposalResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "Đề xuất không ở trạng thái ĐANG_TRANG_BỊ hoặc không có máy tính trong phòng",
    schema: {
      example: {
        statusCode: 400,
        message: "Chỉ có thể hoàn thành đề xuất ở trạng thái ĐANG_TRANG_BỊ",
        error: "Bad Request",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: "Không có quyền hoàn thành đề xuất này",
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy đề xuất hoặc proposal item",
  })
  async completeProposal(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() completeDto: CompleteSoftwareProposalDto,
    @CurrentUser() user: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.softwareProposalsService.completeProposal(id, completeDto, user);
  }
}
