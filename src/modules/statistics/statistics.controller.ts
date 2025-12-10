import {
  Controller,
  Get,
  UseGuards,
  Query,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from "@nestjs/swagger";
import { StatisticsService } from "./statistics.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@ApiTags("Statistics")
@Controller("api/v1/statistics")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get()
  @ApiOperation({ 
    summary: "Lấy thống kê tổng hợp về repair requests, replacement proposals, và software proposals",
    description: `
      Lấy thống kê tổng hợp về:
      - Repair Requests theo trạng thái
      - Error Types (loại lỗi)
      - Replacement Proposals theo trạng thái
      - Chi tiết Replacement Proposals (số lượng đề xuất và tổng linh kiện)
      - Software Proposals theo trạng thái
      - Chi tiết Software Proposals (số lượng đề xuất và tổng phần mềm)
      
      **Yêu cầu:** User phải đăng nhập (JWT token)
    `
  })
  @ApiResponse({
    status: 200,
    description: "Thống kê tổng hợp",
  })
  async getStatistics() {
    return this.statisticsService.getStatistics();
  }

  @Get("rooms")
  @ApiOperation({ 
    summary: "Lấy thống kê theo phòng - cấu hình máy và phần mềm",
    description: `
      Lấy thống kê theo từng phòng bao gồm:
      - Thông tin phòng (tên, mã phòng, tòa nhà, tầng)
      - Tổng số máy tính trong phòng
      - Cấu hình máy tính (lấy từ máy đầu tiên trong phòng làm đại diện)
      - Danh sách phần mềm đã cài đặt (lấy từ máy đầu tiên trong phòng làm đại diện)
      
      **Lưu ý:** Vì tất cả máy trong một phòng có cấu hình và phần mềm giống nhau,
      nên chỉ lấy thông tin từ máy đầu tiên làm đại diện.
      
      **Filters:** Có thể filter theo tòa nhà, tầng, hoặc phòng cụ thể
      
      **Yêu cầu:** User phải đăng nhập (JWT token)
    `
  })
  @ApiQuery({
    name: "building",
    required: false,
    description: "Lọc theo tòa nhà",
  })
  @ApiQuery({
    name: "floor",
    required: false,
    description: "Lọc theo tầng",
  })
  @ApiQuery({
    name: "roomId",
    required: false,
    description: "Lọc theo ID phòng cụ thể",
  })
  @ApiResponse({
    status: 200,
    description: "Danh sách thống kê theo phòng",
  })
  async getRoomStatistics(
    @Query("building") building?: string,
    @Query("floor") floor?: string,
    @Query("roomId") roomId?: string,
  ) {
    return this.statisticsService.getRoomStatistics({
      building,
      floor,
      roomId,
    });
  }
}

