import { 
    Controller, 
    Get, 
    Post, 
    Delete, 
    Body, 
    Param, 
    Query,
    HttpCode,
    HttpStatus,
    UseGuards,
    ParseUUIDPipe,
} from '@nestjs/common';
import { TechnicianAssignmentService } from './technician-assignment.service';
import { CreateTechnicianAssignmentDto } from './dto/create-technician-assignment.dto';
import { QueryTechnicianAssignmentDto } from './dto/query-technician-assignment.dto';

@Controller('technician-assignments')
export class TechnicianAssignmentController {
    constructor(
        private readonly technicianAssignmentService: TechnicianAssignmentService
    ) {}

    /**
     * POST /technician-assignments
     * Tạo phân công mới cho kỹ thuật viên
     * Body: { technicianId, building, floor? }
     */
    @Post()
    @HttpCode(HttpStatus.CREATED)
    async create(@Body() createDto: CreateTechnicianAssignmentDto) {
        return await this.technicianAssignmentService.create(createDto);
    }

    /**
     * GET /technician-assignments
     * Lấy danh sách phân công với bộ lọc
     * Query params: technicianId?, building?, floor?
     */
    @Get()
    async findAll(@Query() query: QueryTechnicianAssignmentDto) {
        return await this.technicianAssignmentService.findAll(query);
    }

    /**
     * GET /technician-assignments/buildings-floors
     * Lấy danh sách tất cả tòa nhà và tầng trong hệ thống
     */
    @Get('buildings-floors')
    async getBuildingsAndFloors() {
        return await this.technicianAssignmentService.getBuildingsAndFloors();
    }

    /**
     * GET /technician-assignments/statistics
     * Lấy thống kê về phân công theo tòa nhà
     */
    @Get('statistics')
    async getStatistics() {
        return await this.technicianAssignmentService.getAssignmentStatistics();
    }

    /**
     * GET /technician-assignments/room/:roomId/technicians
     * Lấy danh sách KTV phụ trách một phòng cụ thể
     */
    @Get('room/:roomId/technicians')
    async getTechniciansForRoom(
        @Param('roomId', ParseUUIDPipe) roomId: string
    ) {
        return await this.technicianAssignmentService.getTechniciansForRoom(roomId);
    }

    /**
     * GET /technician-assignments/asset/:assetId/suggested-technicians
     * Lấy danh sách KTV được đề xuất cho một asset
     * (dựa vào vị trí của asset)
     */
    @Get('asset/:assetId/suggested-technicians')
    async getSuggestedTechniciansForAsset(
        @Param('assetId', ParseUUIDPipe) assetId: string
    ) {
        return await this.technicianAssignmentService.getSuggestedTechniciansForAsset(assetId);
    }

    /**
     * GET /technician-assignments/:technicianId/:building
     * Lấy thông tin phân công cụ thể (quản lý cả tòa nhà)
     */
    @Get(':technicianId/:building')
    async findOne(
        @Param('technicianId', ParseUUIDPipe) technicianId: string,
        @Param('building') building: string,
    ) {
        return await this.technicianAssignmentService.findOne(technicianId, building);
    }

    /**
     * GET /technician-assignments/:technicianId/:building/:floor
     * Lấy thông tin phân công cụ thể (quản lý tầng cụ thể)
     */
    @Get(':technicianId/:building/:floor')
    async findOneWithFloor(
        @Param('technicianId', ParseUUIDPipe) technicianId: string,
        @Param('building') building: string,
        @Param('floor') floor: string,
    ) {
        return await this.technicianAssignmentService.findOne(technicianId, building, floor);
    }

    /**
     * DELETE /technician-assignments/:technicianId/:building
     * Xóa phân công cho cả tòa nhà
     */
    @Delete(':technicianId/:building')
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(
        @Param('technicianId', ParseUUIDPipe) technicianId: string,
        @Param('building') building: string,
    ) {
        await this.technicianAssignmentService.remove(technicianId, building);
    }

    /**
     * DELETE /technician-assignments/:technicianId/:building/:floor
     * Xóa phân công cho tầng cụ thể
     */
    @Delete(':technicianId/:building/:floor')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeWithFloor(
        @Param('technicianId', ParseUUIDPipe) technicianId: string,
        @Param('building') building: string,
        @Param('floor') floor: string,
    ) {
        await this.technicianAssignmentService.remove(technicianId, building, floor);
    }

    /**
     * DELETE /technician-assignments/technician/:technicianId
     * Xóa tất cả phân công của một kỹ thuật viên
     */
    @Delete('technician/:technicianId')
    @HttpCode(HttpStatus.NO_CONTENT)
    async removeAllForTechnician(
        @Param('technicianId', ParseUUIDPipe) technicianId: string
    ) {
        await this.technicianAssignmentService.removeAllAssignmentsForTechnician(technicianId);
    }
}

