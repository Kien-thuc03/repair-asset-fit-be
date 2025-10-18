import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ManagerPermission } from '../../entities/manager-permission.entity';
import { Permission } from '../../entities/permission.entity';
import { CreateManagerPermissionDto } from './dtos/create-manager-permission.dto';
import { UpdateManagerPermissionDto } from './dtos/update-manager-permission.dto';
import { CreatePermissionDto } from './dtos/create-permission.dto';
import { UpdatePermissionDto } from './dtos/update-permission.dto';
import { BulkCreatePermissionsDto } from './dtos/bulk-create-permissions.dto';
import { ManagerPermissionResponseDto, PermissionResponseDto } from './dtos/manager-permission-response.dto';
import { CommonUtils } from 'src/common/utils/common.utils';
import { PERMISSION_CODE_PREFIX } from 'src/common/utils/constants';
import { errorResponse } from 'src/common/helpers/error-response';
import { ERR_EXISTS, NOT_FOUND } from 'src/common/utils/error-type-response';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(ManagerPermission)
    private readonly managerPermissionRepository: Repository<ManagerPermission>,
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
  ) {}

  async create(createDto: CreateManagerPermissionDto): Promise<ManagerPermissionResponseDto> {
    const managerPermission = this.managerPermissionRepository.create({
      name: createDto.name,
    });

    if (createDto.permissions && createDto.permissions.length > 0) {
      const permissionPromises = createDto.permissions.map(async (permissionName) => {
        let permission = await this.permissionRepository.findOne({
          where: { name: permissionName },
        });
        
        if (!permission) {
          permission = this.permissionRepository.create({
            name: permissionName,
            code: CommonUtils.generateCode(permissionName, PERMISSION_CODE_PREFIX),
          });
          permission = await this.permissionRepository.save(permission);
        }
        
        return permission;
      });
      
      managerPermission.permissions = await Promise.all(permissionPromises);
    }

    const saved = await this.managerPermissionRepository.save(managerPermission);
    return this.findOne(saved.id);
  }

  async findAll(): Promise<ManagerPermissionResponseDto[]> {
    const managerPermissions = await this.managerPermissionRepository.find({
      relations: ['permissions'],
      order: { createdAt: 'DESC' },
    });

    return managerPermissions.map(this.transformToResponseDto);
  }

  async findOne(id: string): Promise<ManagerPermissionResponseDto> {
    const managerPermission = await this.managerPermissionRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!managerPermission) {
      throw new NotFoundException(`Manager permission with ID ${id} not found`);
    }

    return this.transformToResponseDto(managerPermission);
  }

  async update(id: string, updateDto: UpdateManagerPermissionDto): Promise<ManagerPermissionResponseDto> {
    const managerPermission = await this.managerPermissionRepository.findOne({
      where: { id },
      relations: ['permissions'],
    });

    if (!managerPermission) {
      throw new NotFoundException(`Manager permission with ID ${id} not found`);
    }

    if (updateDto.name) {
      managerPermission.name = updateDto.name;
    }

    if (updateDto.permissions !== undefined) {
      if (updateDto.permissions.length > 0) {
        // Xử lý permissions với cả create mới và update existing dựa vào ID
        const permissionPromises = updateDto.permissions.map(async (permDto) => {
          if (permDto.id) {
            // Update existing permission nếu có ID
            const existingPermission = await this.permissionRepository.findOne({
              where: { id: permDto.id },
            });
            if (existingPermission) {
              existingPermission.name = permDto.name;
              existingPermission.code = CommonUtils.generateCode(permDto.name, PERMISSION_CODE_PREFIX);
              return this.permissionRepository.save(existingPermission);
            } else {
              throw new NotFoundException(`Permission with ID ${permDto.id} not found`);
            }
          } else {
            // Tạo mới permission nếu không có ID
            // Kiểm tra xem đã tồn tại permission với name này chưa
            let permission = await this.permissionRepository.findOne({
              where: { name: permDto.name },
            });
            
            if (!permission) {
              // Tạo mới permission
              permission = this.permissionRepository.create({
                name: permDto.name,
                code: CommonUtils.generateCode(permDto.name, PERMISSION_CODE_PREFIX),
              });
              permission = await this.permissionRepository.save(permission);
            }
            
            return permission;
          }
        });
        
        managerPermission.permissions = await Promise.all(permissionPromises);
      } else {
        managerPermission.permissions = [];
      }
    }

    await this.managerPermissionRepository.save(managerPermission);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const managerPermission = await this.managerPermissionRepository.findOne({
      where: { id },
    });

    if (!managerPermission) {
      throw new NotFoundException(`Manager permission with ID ${id} not found`);
    }

    await this.managerPermissionRepository.softDelete(id);
  }

  private transformToResponseDto(managerPermission: ManagerPermission): ManagerPermissionResponseDto {
    return {
      id: managerPermission.id,
      name: managerPermission.name,
      permissions: managerPermission.permissions?.map(permission => ({
        id: permission.id,
        name: permission.name,
        code: permission.code,
      })) ?? [],
    };
  }

  // ========== NEW PERMISSION METHODS (NOT MANAGER PERMISSION) ==========

  /**
   * createPermission
   * @description Tạo một permission mới
   * @param createDto CreatePermissionDto
   * @returns PermissionResponseDto
   */
  async createPermission(createDto: CreatePermissionDto): Promise<PermissionResponseDto> {
    // Kiểm tra code đã tồn tại chưa
    const existingPermission = await this.permissionRepository.findOne({
      where: { code: createDto.code },
    });

    if (existingPermission) {
      throw new ConflictException(
        errorResponse(ERR_EXISTS, `Permission with code '${createDto.code}' already exists`)
      );
    }

    const permission = this.permissionRepository.create({
      name: createDto.name,
      code: createDto.code,
    });

    const saved = await this.permissionRepository.save(permission);
    return this.transformPermissionToResponseDto(saved);
  }

  /**
   * createMany
   * @description Tạo nhiều permissions cùng lúc (bulk create)
   * @param bulkDto BulkCreatePermissionsDto
   * @returns PermissionResponseDto[]
   */
  async createMany(bulkDto: BulkCreatePermissionsDto): Promise<PermissionResponseDto[]> {
    const results: PermissionResponseDto[] = [];
    const errors: string[] = [];

    for (const permDto of bulkDto.permissions) {
      try {
        // Kiểm tra code đã tồn tại chưa
        const existing = await this.permissionRepository.findOne({
          where: { code: permDto.code },
        });

        if (existing) {
          errors.push(`Permission with code '${permDto.code}' already exists - skipping`);
          continue;
        }

        const permission = this.permissionRepository.create({
          name: permDto.name,
          code: permDto.code,
        });

        const saved = await this.permissionRepository.save(permission);
        results.push(this.transformPermissionToResponseDto(saved));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        errors.push(`Failed to create permission '${permDto.code}': ${errorMsg}`);
      }
    }

    if (errors.length > 0) {
      console.warn('Bulk create permissions completed with errors:', errors);
    }

    return results;
  }

  /**
   * findAllPermissions
   * @description Lấy tất cả permissions
   * @returns PermissionResponseDto[]
   */
  async findAllPermissions(): Promise<PermissionResponseDto[]> {
    const permissions = await this.permissionRepository.find({
      order: { name: 'ASC' },
    });

    return permissions.map(this.transformPermissionToResponseDto);
  }

  /**
   * findOnePermission
   * @description Tìm permission theo ID
   * @param id Permission UUID
   * @returns PermissionResponseDto
   */
  async findOnePermission(id: string): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(
        errorResponse(NOT_FOUND, `Permission with ID ${id} not found`)
      );
    }

    return this.transformPermissionToResponseDto(permission);
  }

  /**
   * updatePermission
   * @description Cập nhật permission
   * @param id Permission UUID
   * @param updateDto UpdatePermissionDto
   * @returns PermissionResponseDto
   */
  async updatePermission(id: string, updateDto: UpdatePermissionDto): Promise<PermissionResponseDto> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(
        errorResponse(NOT_FOUND, `Permission with ID ${id} not found`)
      );
    }

    // Nếu cập nhật code, kiểm tra trùng
    if (updateDto.code && updateDto.code !== permission.code) {
      const existingPermission = await this.permissionRepository.findOne({
        where: { code: updateDto.code },
      });

      if (existingPermission && existingPermission.id !== id) {
        throw new ConflictException(
          errorResponse(ERR_EXISTS, `Permission with code '${updateDto.code}' already exists`)
        );
      }
    }

    if (updateDto.name) {
      permission.name = updateDto.name;
    }

    if (updateDto.code) {
      permission.code = updateDto.code;
    }

    const updated = await this.permissionRepository.save(permission);
    return this.transformPermissionToResponseDto(updated);
  }

  /**
   * removePermission
   * @description Xóa permission (soft delete)
   * @param id Permission UUID
   */
  async removePermission(id: string): Promise<void> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
    });

    if (!permission) {
      throw new NotFoundException(
        errorResponse(NOT_FOUND, `Permission with ID ${id} not found`)
      );
    }

    await this.permissionRepository.softDelete(id);
  }

  /**
   * transformPermissionToResponseDto
   * @description Transform Permission entity to PermissionResponseDto
   * @param permission Permission entity
   * @returns PermissionResponseDto
   */
  private transformPermissionToResponseDto(permission: Permission): PermissionResponseDto {
    return {
      id: permission.id,
      name: permission.name,
      code: permission.code,
      createdAt: permission.createdAt,
      updatedAt: permission.updatedAt,
    };
  }
}
