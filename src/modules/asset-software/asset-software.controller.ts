import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from "@nestjs/swagger";
import { AssetSoftwareService } from "./asset-software.service";
import { CreateAssetSoftwareDto } from "./dto/create-asset-software.dto";
import { UpdateAssetSoftwareDto } from "./dto/update-asset-software.dto";
import { AssetSoftwareResponseDto } from "./dto/asset-software-response.dto";
import { AssetSoftwareFilterDto } from "./dto/asset-software-filter.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { User } from "src/entities/user.entity";

@ApiTags("Asset Software")
@Controller("api/v1/asset-software")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AssetSoftwareController {
  constructor(private readonly assetSoftwareService: AssetSoftwareService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: "Cài đặt phần mềm lên tài sản",
    description: `
      ## 📋 HƯỚNG DẪN CÀI ĐẶT PHẦN MỀM LÊN TÀI SẢN

      ### 🎯 Mục đích
      Cài đặt một phần mềm cụ thể lên tài sản máy tính trong hệ thống.

      ### 📝 Các bước thực hiện:

      **Bước 1: Chuẩn bị dữ liệu**
      - Lấy ID tài sản từ danh sách assets (chỉ assets có shape = 'COMPUTER')
      - Lấy ID phần mềm từ danh sách software
      - Chuẩn bị ngày cài đặt (tùy chọn, mặc định là hôm nay)
      - Ghi chú về license key hoặc thông tin cài đặt (tùy chọn)

      **Bước 2: Gọi API**
      \`\`\`json
      POST /api/v1/asset-software
      {
        "assetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
        "softwareId": "d52a67b3-155f-4d30-8134-94de8fecf657",
        "installationDate": "2024-01-15",
        "notes": "License key: ABC123-DEF456"
      }
      \`\`\`

      **Bước 3: Kiểm tra kết quả**
      - Hệ thống sẽ trả về thông tin chi tiết về việc cài đặt
      - Bao gồm thông tin tài sản, phần mềm và phòng hiện tại

      ### ⚠️ Điều kiện bắt buộc:
      - Tài sản phải tồn tại và chưa bị xóa
      - Tài sản phải có loại 'COMPUTER' (shape = 'COMPUTER')
      - Phần mềm phải tồn tại và chưa bị xóa
      - Phần mềm chưa được cài đặt trên tài sản này trước đó
      - Người dùng phải đăng nhập và có quyền thực hiện

      ### 📚 Dữ liệu mẫu:
      **Tài sản mẫu:** "Máy vi tính Vostro 270MT" (ID: 48b11d82-dee9-4003-b34d-d6063cbb230a)
      **Phần mềm mẫu:** "Microsoft Office 2021" (ID: d52a67b3-155f-4d30-8134-94de8fecf657)

      ### 🔄 Kết quả mong đợi:
      - Status: 201 Created
      - Dữ liệu trả về: Chi tiết về việc cài đặt bao gồm thông tin tài sản, phần mềm, ngày cài đặt
    `,
  })
  @ApiBody({
    type: CreateAssetSoftwareDto,
    description: "Dữ liệu cài đặt phần mềm lên tài sản",
    examples: {
      "office-install": {
        summary: "📊 Cài đặt Microsoft Office 2021",
        description:
          "Ví dụ cài đặt Microsoft Office với license key và ghi chú chi tiết",
        value: {
          assetId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          softwareId: "d52a67b3-155f-4d30-8134-94de8fecf657",
          installationDate: "2024-01-15",
          notes:
            "License key: OFFICE-2021-PRO-PLUS. Cài đặt bản Professional Plus cho phòng Lab 1.",
        },
      },
      "autocad-install": {
        summary: "🎨 Cài đặt AutoCAD 2024",
        description: "Ví dụ cài đặt AutoCAD với license giáo dục",
        value: {
          assetId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          softwareId: "9252568d-6bfd-47fb-969d-64bad9f1d193",
          installationDate: "2024-01-20",
          notes:
            "License giáo dục - Sử dụng cho môn Thiết kế kỹ thuật. Cấu hình cho sinh viên.",
        },
      },
      "vscode-simple": {
        summary: "💻 Cài đặt Visual Studio Code (đơn giản)",
        description: "Ví dụ cài đặt đơn giản chỉ với thông tin bắt buộc",
        value: {
          assetId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          softwareId: "1aa594ca-83f6-4b07-bad1-a6f88d5ece3f",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: "Cài đặt phần mềm thành công",
    type: AssetSoftwareResponseDto,
    schema: {
      example: {
        assetId: "48b11d82-dee9-4003-b34d-d6063cbb230a",
        softwareId: "d52a67b3-155f-4d30-8134-94de8fecf657",
        installationDate: "2024-01-15",
        notes: "License key: ABC123-DEF456",
        asset: {
          id: "48b11d82-dee9-4003-b34d-d6063cbb230a",
          ktCode: "1",
          fixedCode: "FC-001",
          name: "Máy vi tính Vostro 270MT",
          type: "FIXED_ASSET",
          status: "IN_USE",
        },
        software: {
          id: "d52a67b3-155f-4d30-8134-94de8fecf657",
          name: "Microsoft Office 2021",
          version: "2021",
          publisher: "Microsoft",
        },
        room: {
          id: "room-123",
          name: "Phòng Lab 1",
          building: "Tòa A",
          floor: "Tầng 2",
          roomNumber: "A201",
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: "❌ Dữ liệu không hợp lệ hoặc tài sản không phù hợp",
    schema: {
      examples: {
        "not-computer": {
          summary: "Tài sản không phải máy tính",
          value: {
            statusCode: 400,
            message: "Chỉ có thể cài đặt phần mềm lên tài sản máy tính",
            error: "Bad Request",
          },
        },
        "asset-deleted": {
          summary: "Tài sản đã bị xóa",
          value: {
            statusCode: 400,
            message: "Tài sản này đã bị xóa, không thể cài đặt phần mềm",
            error: "Bad Request",
          },
        },
        "validation-error": {
          summary: "Lỗi validation dữ liệu",
          value: {
            statusCode: 400,
            message: [
              "ID tài sản không được để trống",
              "ID phần mềm phải là UUID hợp lệ",
            ],
            error: "Bad Request",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "🔍 Không tìm thấy tài sản hoặc phần mềm",
    schema: {
      examples: {
        "asset-not-found": {
          summary: "Không tìm thấy tài sản",
          value: {
            statusCode: 404,
            message:
              "Không tìm thấy tài sản với ID: 48b11d82-dee9-4003-b34d-d6063cbb230a",
            error: "Not Found",
          },
        },
        "software-not-found": {
          summary: "Không tìm thấy phần mềm",
          value: {
            statusCode: 404,
            message:
              "Không tìm thấy phần mềm với ID: d52a67b3-155f-4d30-8134-94de8fecf657",
            error: "Not Found",
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: "⚠️ Phần mềm đã được cài đặt trên tài sản này",
    schema: {
      example: {
        statusCode: 409,
        message:
          'Phần mềm "Microsoft Office 2021" đã được cài đặt trên tài sản này',
        error: "Conflict",
        suggestion:
          "Sử dụng PUT để cập nhật thông tin cài đặt hiện có hoặc DELETE để gỡ trước khi cài lại",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: "Chưa đăng nhập hoặc token không hợp lệ",
  })
  async create(
    @Body() createAssetSoftwareDto: CreateAssetSoftwareDto,
    @CurrentUser() user: User
  ): Promise<AssetSoftwareResponseDto> {
    return this.assetSoftwareService.create(createAssetSoftwareDto, user);
  }

  @Get()
  @ApiOperation({
    summary: "Lấy danh sách phần mềm được cài đặt",
    description: `
      Lấy danh sách tất cả phần mềm được cài đặt trên các tài sản với khả năng lọc và phân trang.
      
      **Tính năng:**
      - Phân trang với page và limit
      - Lọc theo tài sản hoặc phần mềm
      - Tìm kiếm theo tên tài sản hoặc phần mềm
      - Sắp xếp theo các trường khác nhau
    `,
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng item trên mỗi trang",
    example: 10,
  })
  @ApiQuery({
    name: "assetId",
    required: false,
    description: "Lọc theo ID tài sản",
  })
  @ApiQuery({
    name: "softwareId",
    required: false,
    description: "Lọc theo ID phần mềm",
  })
  @ApiQuery({
    name: "search",
    required: false,
    description: "Tìm kiếm theo tên tài sản hoặc tên phần mềm",
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
  async findAll(@Query() filter: AssetSoftwareFilterDto) {
    return this.assetSoftwareService.findAll(filter);
  }

  @Get(":assetId/:softwareId")
  @ApiOperation({
    summary: "Lấy thông tin chi tiết phần mềm được cài đặt",
    description:
      "Lấy thông tin chi tiết về một phần mềm được cài đặt trên một tài sản cụ thể",
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Lấy thông tin chi tiết thành công",
    type: AssetSoftwareResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phần mềm được cài đặt trên tài sản",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy phần mềm được cài đặt trên tài sản",
        error: "Not Found",
      },
    },
  })
  async findOne(
    @Param("assetId") assetId: string,
    @Param("softwareId") softwareId: string
  ): Promise<AssetSoftwareResponseDto> {
    return this.assetSoftwareService.findOne(assetId, softwareId);
  }

  @Put(":assetId/:softwareId")
  @ApiOperation({
    summary: "Cập nhật thông tin cài đặt phần mềm",
    description: `
      Cập nhật thông tin về việc cài đặt phần mềm trên tài sản.
      
      **Có thể cập nhật:**
      - Ngày cài đặt
      - Ghi chú (ví dụ: key license)
    `,
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiBody({ type: UpdateAssetSoftwareDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Cập nhật thông tin thành công",
    type: AssetSoftwareResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phần mềm được cài đặt trên tài sản",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy phần mềm được cài đặt trên tài sản",
        error: "Not Found",
      },
    },
  })
  async update(
    @Param("assetId") assetId: string,
    @Param("softwareId") softwareId: string,
    @Body() updateAssetSoftwareDto: UpdateAssetSoftwareDto,
    @CurrentUser() user: User
  ): Promise<AssetSoftwareResponseDto> {
    return this.assetSoftwareService.update(
      assetId,
      softwareId,
      updateAssetSoftwareDto,
      user
    );
  }

  @Delete(":assetId/:softwareId")
  @ApiOperation({
    summary: "Gỡ phần mềm khỏi tài sản",
    description: `
      Gỡ bỏ một phần mềm khỏi một tài sản cụ thể.
      
      **Lưu ý:**
      - Chỉ xóa bản ghi cài đặt, không xóa phần mềm hoặc tài sản
      - Ghi log hoạt động
    `,
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Gỡ phần mềm thành công",
    schema: {
      example: {
        message: "Gỡ phần mềm thành công",
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: "Không tìm thấy phần mềm được cài đặt trên tài sản",
    schema: {
      example: {
        statusCode: 404,
        message: "Không tìm thấy phần mềm được cài đặt trên tài sản",
        error: "Not Found",
      },
    },
  })
  async remove(
    @Param("assetId") assetId: string,
    @Param("softwareId") softwareId: string,
    @CurrentUser() user: User
  ): Promise<{ message: string }> {
    return this.assetSoftwareService.remove(assetId, softwareId, user);
  }

  @Get("asset/:assetId")
  @ApiOperation({
    summary: "Lấy danh sách phần mềm của một tài sản",
    description:
      "Lấy danh sách tất cả phần mềm được cài đặt trên một tài sản cụ thể",
  })
  @ApiParam({
    name: "assetId",
    description: "ID của tài sản",
    example: "123e4567-e89b-12d3-a456-426614174000",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng item trên mỗi trang",
    example: 10,
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
  async findByAsset(
    @Param("assetId") assetId: string,
    @Query() filter: AssetSoftwareFilterDto
  ) {
    filter.assetId = assetId;
    return this.assetSoftwareService.findAll(filter);
  }

  @Get("software/:softwareId")
  @ApiOperation({
    summary: "Lấy danh sách tài sản có cài một phần mềm",
    description: "Lấy danh sách tất cả tài sản đã cài đặt một phần mềm cụ thể",
  })
  @ApiParam({
    name: "softwareId",
    description: "ID của phần mềm",
    example: "123e4567-e89b-12d3-a456-426614174001",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Số trang (bắt đầu từ 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Số lượng item trên mỗi trang",
    example: 10,
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
  async findBySoftware(
    @Param("softwareId") softwareId: string,
    @Query() filter: AssetSoftwareFilterDto
  ) {
    filter.softwareId = softwareId;
    return this.assetSoftwareService.findAll(filter);
  }
}
