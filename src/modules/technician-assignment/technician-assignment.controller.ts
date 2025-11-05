import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { TechnicianAssignmentService } from "./technician-assignment.service";
import { QueryTechnicianAssignmentDto } from "./dto/query-technician-assignment.dto";
import { UpdateTechnicianAssignmentDto } from "./dto/update-technician-assignment.dto";

@ApiTags("Technician Assignments")
@Controller("technician-assignments")
export class TechnicianAssignmentController {
  constructor(
    private readonly technicianAssignmentService: TechnicianAssignmentService
  ) {}

  /**
   * GET /technician-assignments
   * Lấy tất cả phân công với tùy chọn lọc theo building và floor
   */
  @Get()
  @ApiOperation({ summary: "Lấy tất cả phân công kỹ thuật viên" })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách phân công thành công",
  })
  @ApiQuery({
    name: "building",
    required: false,
    description: "Lọc theo tòa nhà",
  })
  @ApiQuery({ name: "floor", required: false, description: "Lọc theo tầng" })
  async findAll(@Query() query: QueryTechnicianAssignmentDto) {
    return await this.technicianAssignmentService.findAll(query);
  }

  /**
   * GET /technician-assignments/rooms
   * Lấy danh sách phòng với thông tin kỹ thuật viên phụ trách
   */
  @Get("rooms")
  @ApiOperation({ summary: "Lấy danh sách phòng với kỹ thuật viên phụ trách" })
  @ApiResponse({ status: 200, description: "Lấy danh sách phòng thành công" })
  @ApiQuery({
    name: "building",
    required: false,
    description: "Lọc theo tòa nhà",
  })
  @ApiQuery({ name: "floor", required: false, description: "Lọc theo tầng" })
  async getRoomsWithTechnicians(
    @Query("building") building?: string,
    @Query("floor") floor?: string
  ) {
    return await this.technicianAssignmentService.getRoomsWithTechnicians(
      building,
      floor
    );
  }

  /**
   * GET /technician-assignments/technicians
   * Lấy danh sách kỹ thuật viên với các phòng họ phụ trách
   */
  @Get("technicians")
  @ApiOperation({
    summary: "Lấy danh sách kỹ thuật viên với thông tin phòng phụ trách",
  })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách kỹ thuật viên thành công",
  })
  async getTechniciansWithRooms() {
    return await this.technicianAssignmentService.getTechniciansWithRooms();
  }

  /**
   * GET /technician-assignments/floor/:building/:floor
   * Lấy danh sách phân công theo tầng cụ thể
   */
  @Get("floor/:building/:floor")
  @ApiOperation({ summary: "Lấy danh sách phân công theo tầng" })
  @ApiResponse({
    status: 200,
    description: "Lấy danh sách phân công thành công",
  })
  @ApiParam({ name: "building", description: "Tên tòa nhà" })
  @ApiParam({ name: "floor", description: "Tên tầng" })
  async findByFloor(
    @Param("building") building: string,
    @Param("floor") floor: string
  ) {
    return await this.technicianAssignmentService.findByFloor(building, floor);
  }

  /**
   * GET /technician-assignments/:id
   * Lấy thông tin một phân công theo ID
   */
  @Get(":id")
  @ApiOperation({ summary: "Lấy thông tin phân công theo ID" })
  @ApiResponse({
    status: 200,
    description: "Lấy thông tin phân công thành công",
  })
  @ApiResponse({ status: 404, description: "Không tìm thấy phân công" })
  @ApiParam({ name: "id", description: "ID của phân công" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    return await this.technicianAssignmentService.findOne(id);
  }

  /**
   * PATCH /technician-assignments/assign
   * Phân công kỹ thuật viên cho một tầng cụ thể
   */
  @Patch("assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Phân công kỹ thuật viên cho một tầng" })
  @ApiResponse({
    status: 200,
    description: "Phân công kỹ thuật viên thành công",
  })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy kỹ thuật viên",
  })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  async assignTechnicianToFloor(
    @Body() updateDto: UpdateTechnicianAssignmentDto
  ) {
    return await this.technicianAssignmentService.update("", updateDto);
  }

  /**
   * PATCH /technician-assignments/:id
   * Cập nhật kỹ thuật viên cho phân công (deprecated - use /assign instead)
   */
  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cập nhật kỹ thuật viên cho phân công" })
  @ApiResponse({ status: 200, description: "Cập nhật phân công thành công" })
  @ApiResponse({
    status: 404,
    description: "Không tìm thấy phân công hoặc kỹ thuật viên",
  })
  @ApiResponse({ status: 400, description: "Dữ liệu không hợp lệ" })
  @ApiParam({ name: "id", description: "ID của phân công" })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateTechnicianAssignmentDto
  ) {
    return await this.technicianAssignmentService.update(id, updateDto);
  }
}
