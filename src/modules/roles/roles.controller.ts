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
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
} from "@nestjs/swagger";
import { RolesService } from "./roles.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { BulkCreateRolesDto } from "./dto/bulk-create-roles.dto";
import { AssignPermissionsToRoleDto, BulkAssignPermissionsDto } from "./dto/assign-permissions.dto";
import { RoleResponseDto } from "./dto/role-response.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { Permissions } from "../auth/decorators/permissions.decorator";
import { PermissionConstants } from "src/common/utils/permission.constant";

@ApiTags("Roles")
@Controller("api/v1/roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Tạo vai trò mới',
    description: 'Tạo một vai trò mới với các quyền được chỉ định. Code phải là unique và theo format UPPER_SNAKE_CASE.'
  })
  @ApiBadRequestResponse({ description: "Bad Request" })
  @ApiNotFoundResponse({ description: "Not Found" })
  @ApiBody({ 
    type: CreateRoleDto,
    examples: {
      lecturer: {
        summary: 'Vai trò Giảng viên',
        value: {
          name: 'Giảng viên',
          code: 'GIANG_VIEN',
          permissionIds: []
        }
      },
      technician: {
        summary: 'Vai trò Kỹ thuật viên với quyền',
        value: {
          name: 'Kỹ thuật viên',
          code: 'KY_THUAT_VIEN',
          permissionIds: ['perm-uuid-5', 'perm-uuid-6', 'perm-uuid-7']
        }
      }
    }
  })
  @ApiResponse({ status: 201, type: RoleResponseDto, description: 'Role created successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_CREATE_ROLE)
  @ApiBearerAuth()
  async create(@Body() createRoleDto: CreateRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.create(createRoleDto);
  }

  @Post("bulk")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ 
    summary: 'Tạo nhiều vai trò cùng lúc',
    description: 'Bulk create multiple roles. Hữu ích cho việc seeding data ban đầu.'
  })
  @ApiBody({ 
    type: BulkCreateRolesDto,
    examples: {
      allRoles: {
        summary: 'Tất cả vai trò trong hệ thống',
        value: {
          roles: [
            { name: 'Giảng viên', code: 'GIANG_VIEN', permissionIds: [] },
            { name: 'Kỹ thuật viên', code: 'KY_THUAT_VIEN', permissionIds: [] },
            { name: 'Tổ trưởng Kỹ thuật', code: 'TO_TRUONG_KY_THUAT', permissionIds: [] },
            { name: 'Nhân viên Phòng Quản trị', code: 'PHONG_QUAN_TRI', permissionIds: [] },
            { name: 'Quản trị viên Khoa', code: 'QTV_KHOA', permissionIds: [] }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 201, type: [RoleResponseDto], description: 'Roles created successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_CREATE_ROLE)
  @ApiBearerAuth()
  async createMany(@Body() bulkDto: BulkCreateRolesDto): Promise<RoleResponseDto[]> {
    return this.rolesService.createMany(bulkDto);
  }

  @Post("assign-permissions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Gán quyền cho vai trò',
    description: 'Assign một tập các quyền cho một vai trò cụ thể'
  })
  @ApiBody({ 
    type: AssignPermissionsToRoleDto,
    examples: {
      assignToLecturer: {
        summary: 'Gán quyền cho Giảng viên',
        value: {
          roleId: 'role-uuid-1',
          permissionIds: ['perm-uuid-1', 'perm-uuid-2', 'perm-uuid-3', 'perm-uuid-4']
        }
      }
    }
  })
  @ApiResponse({ status: 200, type: RoleResponseDto, description: 'Permissions assigned successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_UPDATE_ROLE)
  @ApiBearerAuth()
  async assignPermissions(@Body() assignDto: AssignPermissionsToRoleDto): Promise<RoleResponseDto> {
    return this.rolesService.assignPermissions(assignDto);
  }

  @Post("bulk-assign-permissions")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Gán quyền cho nhiều vai trò cùng lúc',
    description: 'Bulk assign permissions to multiple roles. Hữu ích cho việc setup ban đầu.'
  })
  @ApiBody({ 
    type: BulkAssignPermissionsDto,
    examples: {
      setupAllRolePermissions: {
        summary: 'Setup quyền cho tất cả vai trò',
        value: {
          assignments: [
            {
              roleId: 'role-uuid-1',
              permissionIds: ['perm-uuid-1', 'perm-uuid-2', 'perm-uuid-3', 'perm-uuid-4']
            },
            {
              roleId: 'role-uuid-2',
              permissionIds: ['perm-uuid-5', 'perm-uuid-6', 'perm-uuid-7', 'perm-uuid-8']
            }
          ]
        }
      }
    }
  })
  @ApiResponse({ status: 200, type: [RoleResponseDto], description: 'Permissions assigned successfully' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_UPDATE_ROLE)
  @ApiBearerAuth()
  async bulkAssignPermissions(@Body() bulkDto: BulkAssignPermissionsDto): Promise<RoleResponseDto[]> {
    return this.rolesService.bulkAssignPermissions(bulkDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Lấy tất cả vai trò',
    description: 'Lấy danh sách tất cả các vai trò cùng với permissions của chúng'
  })
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  async findAll(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAll();
  }

  @Get("inventory")
  @HttpCode(HttpStatus.OK)
  @ApiResponse({ status: 200, type: [RoleResponseDto] })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  async findAllInventoryRoles(): Promise<RoleResponseDto[]> {
    return this.rolesService.findAllInventoryRoles();
  }

  @Get(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Lấy thông tin vai trò theo ID',
    description: 'Lấy chi tiết một vai trò cùng với các quyền được gán'
  })
  @ApiParam({ name: 'id', description: 'Role UUID', example: 'role-uuid-1' })
  @ApiNotFoundResponse({ description: "Not Found" })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @ApiBearerAuth()
  async findOne(@Param("id") id: string): Promise<RoleResponseDto> {
    return this.rolesService.findOne(id);
  }

  @Patch(":id")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Cập nhật vai trò',
    description: 'Cập nhật thông tin vai trò. Có thể cập nhật tên, code và/hoặc danh sách permissions.'
  })
  @ApiParam({ name: 'id', description: 'Role UUID', example: 'role-uuid-1' })
  @ApiBody({ 
    type: UpdateRoleDto,
    examples: {
      updateName: {
        summary: 'Cập nhật tên vai trò',
        value: {
          name: 'Kỹ thuật viên chính'
        }
      },
      updatePermissions: {
        summary: 'Cập nhật quyền của vai trò',
        value: {
          permissionIds: ['perm-uuid-1', 'perm-uuid-2', 'perm-uuid-5']
        }
      },
      updateAll: {
        summary: 'Cập nhật tất cả',
        value: {
          name: 'Kỹ thuật viên cao cấp',
          code: 'KY_THUAT_VIEN_CAO_CAP',
          permissionIds: ['perm-uuid-5', 'perm-uuid-6', 'perm-uuid-9']
        }
      }
    }
  })
  @ApiBadRequestResponse({ description: "Bad Request" })
  @ApiNotFoundResponse({ description: "Not Found" })
  @ApiResponse({ status: 200, type: RoleResponseDto })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_UPDATE_ROLE)
  @ApiBearerAuth()
  async update(
    @Param("id") id: string,
    @Body() updateRoleDto: UpdateRoleDto
  ): Promise<RoleResponseDto> {
    return this.rolesService.update(id, updateRoleDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ 
    summary: 'Xóa vai trò',
    description: 'Soft delete một vai trò (không xóa vật lý khỏi database)'
  })
  @ApiParam({ name: 'id', description: 'Role UUID', example: 'role-uuid-1' })
  @ApiResponse({ status: 204, description: 'Role deleted successfully' })
  @ApiNotFoundResponse({ description: 'Role not found' })
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions(PermissionConstants.PERM_REMOVE_ROLE)
  @ApiBearerAuth()
  async remove(@Param("id") id: string): Promise<void> {
    return this.rolesService.remove(id);
  }
}
