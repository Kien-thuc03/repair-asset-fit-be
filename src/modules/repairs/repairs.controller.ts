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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { RepairsService } from './repairs.service';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { UpdateRepairRequestDto } from './dto/update-repair-request.dto';
import { RepairRequestFilterDto } from './dto/repair-request-filter.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { RepairRequestResponseDto } from './dto/repair-request-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from 'src/entities/user.entity';

@ApiTags('Repairs')
@Controller('api/v1/repairs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RepairsController {
  constructor(private readonly repairsService: RepairsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Tạo yêu cầu sửa chữa mới',
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
    description: 'Tạo yêu cầu sửa chữa thành công',
    type: RepairRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dữ liệu không hợp lệ hoặc tài sản không phù hợp',
    schema: {
      example: {
        statusCode: 400,
        message: 'Tài sản này đã bị xóa, không thể tạo yêu cầu sửa chữa',
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy tài sản hoặc loại lỗi',
    schema: {
      example: {
        statusCode: 404,
        message: 'Không tìm thấy tài sản với ID: xxx',
        error: 'Not Found',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Tài sản đang có yêu cầu sửa chữa khác đang xử lý',
    schema: {
      example: {
        statusCode: 409,
        message: 'Tài sản này đang có yêu cầu sửa chữa đang xử lý (YCSC-2025-0001)',
        error: 'Conflict',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Chưa đăng nhập hoặc token không hợp lệ',
  })
  async create(
    @Body() createRepairRequestDto: CreateRepairRequestDto,
    @CurrentUser() user: User,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.create(createRepairRequestDto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách yêu cầu sửa chữa',
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
  @ApiQuery({ name: 'computerAssetId', required: false, description: 'Lọc theo ID tài sản' })
  @ApiQuery({ name: 'reporterId', required: false, description: 'Lọc theo ID người báo lỗi' })
  @ApiQuery({ name: 'assignedTechnicianId', required: false, description: 'Lọc theo ID kỹ thuật viên' })
  @ApiQuery({ name: 'status', required: false, description: 'Lọc theo trạng thái' })
  @ApiQuery({ name: 'errorType', required: false, description: 'Lọc theo loại lỗi' })
  @ApiQuery({ name: 'search', required: false, description: 'Tìm kiếm theo mã hoặc mô tả' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Từ ngày (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Đến ngày (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Số trang (từ 1)', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Số lượng/trang', example: 10 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Trường sắp xếp', example: 'createdAt' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Thứ tự sắp xếp', example: 'DESC' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy danh sách thành công',
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

  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết yêu cầu sửa chữa',
    description: 'Lấy thông tin chi tiết của một yêu cầu sửa chữa bao gồm thông tin tài sản, người báo lỗi, kỹ thuật viên và lịch sử xử lý.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu sửa chữa',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Lấy thông tin thành công',
    type: RepairRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Không tìm thấy yêu cầu sửa chữa',
    schema: {
      example: {
        statusCode: 404,
        message: 'Không tìm thấy yêu cầu sửa chữa với ID: xxx',
        error: 'Not Found',
      },
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Cập nhật yêu cầu sửa chữa',
    description: `
      Cập nhật thông tin yêu cầu sửa chữa.
      
      **Quyền hạn:**
      - Người báo lỗi: Chỉ có thể cập nhật khi trạng thái CHỜ_TIẾP_NHẬN
      - Kỹ thuật viên: Có thể cập nhật khi được phân công
      - Admin: Có thể cập nhật bất kỳ lúc nào
      
      **Lưu ý:**
      - Một số trường chỉ có thể cập nhật ở trạng thái cụ thể
      - Cập nhật trạng thái sẽ tự động cập nhật timestamp tương ứng
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu sửa chữa',
    format: 'uuid',
  })
  @ApiBody({
    type: UpdateRepairRequestDto,
    examples: {
      'update-description': {
        summary: 'Cập nhật mô tả',
        value: {
          description: 'Mô tả chi tiết hơn về sự cố',
          errorType: 'MAY_KHONG_KHOI_DONG',
        },
      },
      'add-resolution': {
        summary: 'Thêm ghi chú xử lý',
        value: {
          resolutionNotes: 'Đã thay thế nguồn điện, máy hoạt động bình thường',
          status: 'ĐÃ_HOÀN_THÀNH',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Cập nhật thành công',
    type: RepairRequestResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Không có quyền cập nhật',
    schema: {
      example: {
        statusCode: 403,
        message: 'Bạn không có quyền cập nhật yêu cầu này',
        error: 'Forbidden',
      },
    },
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateRepairRequestDto,
    @CurrentUser() user: User,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.update(id, updateDto, user);
  }

  @Put(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Tiếp nhận yêu cầu sửa chữa',
    description: `
      Tiếp nhận một yêu cầu sửa chữa, chuyển trạng thái từ CHỜ_TIẾP_NHẬN sang ĐÃ_TIẾP_NHẬN.
      
      **Quyền hạn:**
      - Chỉ kỹ thuật viên hoặc admin mới có thể tiếp nhận
      
      **Sau khi tiếp nhận:**
      - Có thể phân công kỹ thuật viên cụ thể
      - Có thể bắt đầu quá trình xử lý
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu sửa chữa cần tiếp nhận',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Tiếp nhận yêu cầu thành công',
    type: RepairRequestResponseDto,
  })
  async accept(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.acceptRequest(id, user);
  }

  @Put(':id/assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Phân công kỹ thuật viên',
    description: `
      Phân công kỹ thuật viên cho yêu cầu sửa chữa.
      
      **Quyền hạn:**
      - Chỉ admin hoặc trưởng nhóm kỹ thuật mới có thể phân công
      
      **Điều kiện:**
      - Yêu cầu phải đã được tiếp nhận (ĐÃ_TIẾP_NHẬN)
      - Kỹ thuật viên phải có role phù hợp
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu sửa chữa cần phân công',
    format: 'uuid',
  })
  @ApiBody({
    type: AssignTechnicianDto,
    examples: {
      'assign-technician': {
        summary: 'Phân công kỹ thuật viên',
        value: {
          technicianId: '5c345ca6-02aa-41ef-924d-1fb427ce6e1c',
          assignmentNotes: 'Kỹ thuật viên có kinh nghiệm về phần cứng',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Phân công thành công',
    type: RepairRequestResponseDto,
  })
  async assign(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignTechnicianDto,
    @CurrentUser() user: User,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.assignTechnician(id, assignDto, user);
  }

  @Put(':id/start-processing')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Bắt đầu xử lý sửa chữa',
    description: `
      Bắt đầu quá trình sửa chữa, chuyển trạng thái sang ĐANG_XỬ_LÝ.
      
      **Quyền hạn:**
      - Chỉ kỹ thuật viên được phân công mới có thể bắt đầu
      
      **Điều kiện:**
      - Yêu cầu phải đã có kỹ thuật viên được phân công
      - Trạng thái hiện tại phải là ĐÃ_TIẾP_NHẬN
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu sửa chữa cần bắt đầu xử lý',
    format: 'uuid',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Bắt đầu xử lý thành công',
    type: RepairRequestResponseDto,
  })
  async startProcessing(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.startProcessing(id, user);
  }

  @Put(':id/complete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hoàn thành sửa chữa',
    description: `
      Hoàn thành yêu cầu sửa chữa, chuyển trạng thái sang ĐÃ_HOÀN_THÀNH.
      
      **Quyền hạn:**
      - Chỉ kỹ thuật viên được phân công hoặc admin mới có thể hoàn thành
      
      **Điều kiện:**
      - Trạng thái hiện tại phải là ĐANG_XỬ_LÝ hoặc CHỜ_THAY_THẾ
      - Phải có ghi chú kết quả xử lý
      
      **Sau khi hoàn thành:**
      - Cập nhật trạng thái tài sản về bình thường (nếu thành công)
      - Ghi lại thời gian hoàn thành
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu sửa chữa cần hoàn thành',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        resolutionNotes: {
          type: 'string',
          description: 'Ghi chú kết quả xử lý (bắt buộc)',
          example: 'Đã thay thế nguồn điện 500W, máy hoạt động bình thường',
        },
      },
      required: ['resolutionNotes'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hoàn thành sửa chữa thành công',
    type: RepairRequestResponseDto,
  })
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { resolutionNotes: string },
    @CurrentUser() user: User,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.completeRequest(id, body.resolutionNotes, user);
  }

  @Put(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Hủy yêu cầu sửa chữa',
    description: `
      Hủy một yêu cầu sửa chữa, chuyển trạng thái sang ĐÃ_HỦY.
      
      **Quyền hạn:**
      - Người báo lỗi: Chỉ có thể hủy khi CHỜ_TIẾP_NHẬN
      - Admin: Có thể hủy bất kỳ lúc nào (trừ ĐÃ_HOÀN_THÀNH)
      
      **Lưu ý:**
      - Thao tác này không thể hoàn tác
      - Cần cung cấp lý do hủy
    `,
  })
  @ApiParam({
    name: 'id',
    description: 'ID của yêu cầu sửa chữa cần hủy',
    format: 'uuid',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cancelReason: {
          type: 'string',
          description: 'Lý do hủy yêu cầu (bắt buộc)',
          example: 'Người dùng đã tự khắc phục sự cố',
        },
      },
      required: ['cancelReason'],
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Hủy yêu cầu thành công',
    type: RepairRequestResponseDto,
  })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { cancelReason: string },
    @CurrentUser() user: User,
  ): Promise<RepairRequestResponseDto> {
    return this.repairsService.cancelRequest(id, body.cancelReason, user);
  }
}
