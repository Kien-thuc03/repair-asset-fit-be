import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { RepairRequest } from 'src/entities/repair-request.entity';
import { Asset } from 'src/entities/asset.entity';
import { User } from 'src/entities/user.entity';
import { CreateRepairRequestDto } from './dto/create-repair-request.dto';
import { RepairRequestResponseDto } from './dto/repair-request-response.dto';
import { RepairStatus } from 'src/common/shared/RepairStatus';
import { AssetStatus } from 'src/common/shared/AssetStatus';
import { ErrorType } from 'src/common/shared/ErrorType';

@Injectable()
export class RepairsService {
  constructor(
    @InjectRepository(RepairRequest)
    private readonly repairRequestRepository: Repository<RepairRequest>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Tạo yêu cầu sửa chữa mới
   * @param createDto - Dữ liệu tạo yêu cầu sửa chữa
   * @param currentUser - Người dùng hiện tại (người báo lỗi)
   * @returns RepairRequestResponseDto
   */
  async create(
    createDto: CreateRepairRequestDto,
    currentUser: User,
  ): Promise<RepairRequestResponseDto> {
    // 1. Kiểm tra tài sản có tồn tại không
    const asset = await this.assetRepository.findOne({
      where: { id: createDto.computerAssetId },
      relations: ['currentRoom', 'currentRoom.unit'],
    });

    if (!asset) {
      throw new NotFoundException(
        `Không tìm thấy tài sản với ID: ${createDto.computerAssetId}`,
      );
    }

    // 2. Kiểm tra tài sản đã bị xóa chưa
    if (asset.deletedAt) {
      throw new BadRequestException('Tài sản này đã bị xóa, không thể tạo yêu cầu sửa chữa');
    }

    // 3. Kiểm tra tài sản có đang được sửa chữa không
    const existingRepair = await this.repairRequestRepository.findOne({
      where: {
        computerAssetId: createDto.computerAssetId,
        status: RepairStatus.ĐANG_XỬ_LÝ,
      },
    });

    if (existingRepair) {
      throw new ConflictException(
        `Tài sản này đang có yêu cầu sửa chữa đang xử lý (${existingRepair.requestCode})`,
      );
    }

    // 4. Validate ErrorType nếu có (enum validation)
    if (createDto.errorType && !Object.values(ErrorType).includes(createDto.errorType)) {
      throw new BadRequestException(
        `Loại lỗi không hợp lệ. Các giá trị cho phép: ${Object.values(ErrorType).join(', ')}`,
      );
    }

    // 5. Sinh mã yêu cầu tự động (YCSC-YYYY-NNNN)
    const requestCode = await this.generateRequestCode();

    // 6. Tạo repair request mới
    const repairRequest = this.repairRequestRepository.create({
      ...createDto,
      requestCode,
      reporterId: currentUser.id,
      status: RepairStatus.CHỜ_TIẾP_NHẬN,
      createdAt: new Date(),
    });

    // 7. Lưu vào database
    const savedRequest = await this.repairRequestRepository.save(repairRequest);

    // 8. Cập nhật trạng thái tài sản nếu cần
    if (asset.status === AssetStatus.IN_USE) {
      asset.status = AssetStatus.DAMAGED;
      await this.assetRepository.save(asset);
    }

    // 9. Lấy thông tin đầy đủ với relations
    const fullRequest = await this.repairRequestRepository.findOne({
      where: { id: savedRequest.id },
      relations: [
        'computerAsset',
        'computerAsset.currentRoom',
        'reporter',
        'assignedTechnician',
      ],
    });

    // 10. Transform và trả về DTO
    return this.transformToResponseDto(fullRequest);
  }

  /**
   * Sinh mã yêu cầu tự động theo format: YCSC-YYYY-NNNN
   * @returns Mã yêu cầu mới
   */
  private async generateRequestCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `YCSC-${currentYear}-`;

    // Lấy yêu cầu cuối cùng trong năm
    const lastRequest = await this.repairRequestRepository
      .createQueryBuilder('request')
      .where('request.requestCode LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('request.requestCode', 'DESC')
      .getOne();

    let nextNumber = 1;
    if (lastRequest) {
      // Lấy số thứ tự từ mã cuối cùng
      const lastNumber = parseInt(lastRequest.requestCode.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    // Format số thành 4 chữ số (0001, 0002, ...)
    const formattedNumber = nextNumber.toString().padStart(4, '0');
    return `${prefix}${formattedNumber}`;
  }

  /**
   * Transform entity sang DTO response
   * @param request - RepairRequest entity
   * @returns RepairRequestResponseDto
   */
  private transformToResponseDto(
    request: RepairRequest,
  ): RepairRequestResponseDto {
    const dto = plainToInstance(RepairRequestResponseDto, request, {
      excludeExtraneousValues: true,
    });

    // Transform nested objects
    if (request.computerAsset) {
      dto.computerAsset = {
        id: request.computerAsset.id,
        ktCode: request.computerAsset.ktCode,
        name: request.computerAsset.name,
        type: request.computerAsset.type,
        status: request.computerAsset.status,
      } as any;

      // Add room info if exists
      if (request.computerAsset.currentRoom) {
        dto.room = {
          id: request.computerAsset.currentRoom.id,
          name: request.computerAsset.currentRoom.name,
          building: request.computerAsset.currentRoom.building,
          floor: request.computerAsset.currentRoom.floor,
          roomNumber: request.computerAsset.currentRoom.roomNumber,
        } as any;
      }
    }

    if (request.reporter) {
      dto.reporter = {
        id: request.reporter.id,
        fullName: request.reporter.fullName,
        email: request.reporter.email,
        username: request.reporter.username,
      } as any;
    }

    if (request.assignedTechnician) {
      dto.assignedTechnician = {
        id: request.assignedTechnician.id,
        fullName: request.assignedTechnician.fullName,
        email: request.assignedTechnician.email,
        username: request.assignedTechnician.username,
      } as any;
    }

    if (request.errorType) {
      dto.errorType = {
        id: request.errorType,
        name: request.errorType,
        description: request.errorType,
      } as any;
    }

    return dto;
  }
}
