import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { RepairsService } from './repairs.service';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
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
}
