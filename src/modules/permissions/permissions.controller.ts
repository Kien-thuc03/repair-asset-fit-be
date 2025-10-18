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
  UseGuards,
} from "@nestjs/common";
import { PermissionsService } from "./permissions.service";
import { CreatePermissionDto } from "./dtos/create-permission.dto";
import { UpdatePermissionDto } from "./dtos/update-permission.dto";
import { BulkCreatePermissionsDto } from "./dtos/bulk-create-permissions.dto";
import { PermissionResponseDto } from "./dtos/manager-permission-response.dto";
import {
  ApiBearerAuth,
  ApiBody,
  ApiResponse,
  ApiTags,
  ApiOperation,
  ApiParam,
} from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { PermissionConstants } from "src/common/utils/permission.constant";

@ApiTags("Permissions")
@Controller("api/v1/permissions")
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Tạo quyền mới',
    description: 'Tạo một quyền mới trong hệ thống. Code phải là unique và theo format snake_case.'
  })
  @ApiBody({ 
    type: CreatePermissionDto,
    examples: {
      example1: {
        summary: 'Quyền báo cáo sự cố',
        value: {
          name: 'Báo cáo sự cố',
          code: 'report_issues'
        }
      },
      example2: {
        summary: 'Quyền quản lý người dùng',
        value: {
          name: 'Quản lý người dùng',
          code: 'manage_users'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Permission created successfully',
    type: PermissionResponseDto 
  })
  @ApiResponse({ status: 400, description: 'Invalid data or duplicate code' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_CREATE_PERMISSION)
  @ApiBearerAuth()
  async create(
    @Body() createDto: CreatePermissionDto
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.createPermission(createDto);
  }

  @Post("bulk")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Tạo nhiều quyền cùng lúc',
    description: 'Bulk create multiple permissions. Hữu ích cho việc seeding data ban đầu.'
  })
  @ApiBody({ 
    type: BulkCreatePermissionsDto,
    examples: {
      allLecturerPermissions: {
        summary: 'Quyền của Giảng viên',
        value: {
          permissions: [
            { name: 'Báo cáo sự cố', code: 'report_issues' },
            { name: 'Theo dõi tiến độ xử lý', code: 'track_progress' },
            { name: 'Tra cứu thiết bị', code: 'search_equipment' },
            { name: 'Xem thông tin cá nhân', code: 'view_personal_info' }
          ]
        }
      },
      allTechnicianPermissions: {
        summary: 'Quyền của Kỹ thuật viên',
        value: {
          permissions: [
            { name: 'Xử lý báo cáo sự cố', code: 'handle_reports' },
            { name: 'Tạo đề xuất thay thế', code: 'create_replacement_requests' },
            { name: 'Quản lý tài sản', code: 'manage_assets' },
            { name: 'Xem thống kê cá nhân', code: 'view_personal_stats' }
          ]
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Permissions created successfully',
    type: [PermissionResponseDto] 
  })
  @ApiResponse({ status: 400, description: 'Invalid data' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_CREATE_PERMISSION)
  @ApiBearerAuth()
  async createMany(
    @Body() bulkDto: BulkCreatePermissionsDto
  ): Promise<PermissionResponseDto[]> {
    return this.permissionsService.createMany(bulkDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Lấy tất cả quyền',
    description: 'Lấy danh sách tất cả các quyền trong hệ thống'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all permissions',
    type: [PermissionResponseDto] 
  })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  async findAll(): Promise<PermissionResponseDto[]> {
    return this.permissionsService.findAllPermissions();
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Lấy thông tin quyền theo ID',
    description: 'Lấy chi tiết một quyền cụ thể'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Permission UUID',
    example: 'perm-uuid-1'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission details',
    type: PermissionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  async findOne(
    @Param("id") id: string
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.findOnePermission(id);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cập nhật quyền',
    description: 'Cập nhật thông tin của một quyền'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Permission UUID',
    example: 'perm-uuid-1'
  })
  @ApiBody({ 
    type: UpdatePermissionDto,
    examples: {
      updateName: {
        summary: 'Cập nhật tên quyền',
        value: {
          name: 'Báo cáo sự cố máy tính'
        }
      },
      updateBoth: {
        summary: 'Cập nhật cả tên và code',
        value: {
          name: 'Báo cáo và theo dõi sự cố',
          code: 'report_and_track_issues'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Permission updated successfully',
    type: PermissionResponseDto 
  })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_UPDATE_PERMISSION)
  @ApiBearerAuth()
  async update(
    @Param("id") id: string,
    @Body() updateDto: UpdatePermissionDto
  ): Promise<PermissionResponseDto> {
    return this.permissionsService.updatePermission(id, updateDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Xóa quyền',
    description: 'Soft delete một quyền (không xóa vật lý khỏi database)'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'Permission UUID',
    example: 'perm-uuid-1'
  })
  @ApiResponse({ status: 204, description: 'Permission deleted successfully' })
  @ApiResponse({ status: 404, description: 'Permission not found' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_REMOVE_PERMISSION)
  @ApiBearerAuth()
  async remove(@Param("id") id: string): Promise<void> {
    return this.permissionsService.removePermission(id);
  }
}
