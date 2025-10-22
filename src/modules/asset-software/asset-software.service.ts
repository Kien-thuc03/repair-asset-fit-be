import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { plainToInstance } from "class-transformer";
import { AssetSoftware } from "src/entities/asset-software.entity";
import { Asset } from "src/entities/asset.entity";
import { Software } from "src/entities/software.entity";
import { User } from "src/entities/user.entity";
import { CreateAssetSoftwareDto } from "./dto/create-asset-software.dto";
import { UpdateAssetSoftwareDto } from "./dto/update-asset-software.dto";
import { AssetSoftwareFilterDto } from "./dto/asset-software-filter.dto";
import { AssetSoftwareResponseDto } from "./dto/asset-software-response.dto";
import { AssetShape } from "src/common/shared/AssetShape";

@Injectable()
export class AssetSoftwareService {
  constructor(
    @InjectRepository(AssetSoftware)
    private readonly assetSoftwareRepository: Repository<AssetSoftware>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Software)
    private readonly softwareRepository: Repository<Software>
  ) {}

  /**
   * Cài đặt phần mềm lên tài sản
   * @param createDto - Dữ liệu cài đặt phần mềm
   * @param currentUser - Người dùng hiện tại (người thực hiện)
   * @returns AssetSoftwareResponseDto
   */
  async create(
    createDto: CreateAssetSoftwareDto,
    currentUser: User
  ): Promise<AssetSoftwareResponseDto> {
    // 1. Kiểm tra tài sản có tồn tại không
    const asset = await this.assetRepository.findOne({
      where: { id: createDto.assetId },
      relations: ["currentRoom", "currentRoom.unit"],
    });

    if (!asset) {
      throw new NotFoundException(
        `Không tìm thấy tài sản với ID: ${createDto.assetId}`
      );
    }

    // 2. Kiểm tra tài sản đã bị xóa chưa
    if (asset.deletedAt) {
      throw new BadRequestException(
        "Tài sản này đã bị xóa, không thể cài đặt phần mềm"
      );
    }

    // 3. Kiểm tra tài sản có phải là máy tính không (có thể mở rộng validation)
    if (asset.shape !== AssetShape.COMPUTER) {
      throw new BadRequestException(
        "Chỉ có thể cài đặt phần mềm lên tài sản máy tính"
      );
    }

    // 4. Kiểm tra phần mềm có tồn tại không
    const software = await this.softwareRepository.findOne({
      where: { id: createDto.softwareId },
    });

    if (!software) {
      throw new NotFoundException(
        `Không tìm thấy phần mềm với ID: ${createDto.softwareId}`
      );
    }

    // 5. Kiểm tra phần mềm đã được cài trên tài sản này chưa
    const existingAssetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId: createDto.assetId, softwareId: createDto.softwareId },
    });

    if (existingAssetSoftware) {
      throw new ConflictException(
        `Phần mềm "${software.name}" đã được cài đặt trên tài sản này`
      );
    }

    // 6. Tạo bản ghi cài đặt mới
    const assetSoftware = this.assetSoftwareRepository.create({
      assetId: createDto.assetId,
      softwareId: createDto.softwareId,
      installationDate: createDto.installationDate
        ? new Date(createDto.installationDate)
        : new Date(), // Mặc định là ngày hiện tại
      notes: createDto.notes,
    });

    // 7. Lưu vào database
    const savedRecord = await this.assetSoftwareRepository.save(assetSoftware);

    // 8. Lấy thông tin đầy đủ với relations
    const fullRecord = await this.assetSoftwareRepository.findOne({
      where: {
        assetId: savedRecord.assetId,
        softwareId: savedRecord.softwareId,
      },
      relations: ["asset", "software"],
    });

    // 9. Transform và trả về DTO
    return this.transformToResponseDto(fullRecord);
  }

  /**
   * Lấy danh sách phần mềm được cài đặt với lọc và phân trang
   * @param filter - Bộ lọc và phân trang
   * @returns Danh sách phần mềm đã phân trang
   */
  async findAll(filter: AssetSoftwareFilterDto) {
    const queryBuilder = this.createQueryBuilder(filter);

    // Đếm tổng số records
    const total = await queryBuilder.getCount();

    // Phân trang
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    queryBuilder.skip((page - 1) * limit).take(limit);

    // Thực hiện query
    const data = await queryBuilder.getMany();

    const transformedData = data.map((item) =>
      this.transformToResponseDto(item)
    );

    return {
      data: transformedData,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy thông tin chi tiết một phần mềm được cài trên tài sản
   * @param assetId - ID tài sản
   * @param softwareId - ID phần mềm
   * @returns AssetSoftwareResponseDto
   */
  async findOne(
    assetId: string,
    softwareId: string
  ): Promise<AssetSoftwareResponseDto> {
    const assetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    if (!assetSoftware) {
      throw new NotFoundException(
        "Không tìm thấy phần mềm được cài đặt trên tài sản"
      );
    }

    return this.transformToResponseDto(assetSoftware);
  }

  /**
   * Cập nhật thông tin cài đặt phần mềm
   * @param assetId - ID tài sản
   * @param softwareId - ID phần mềm
   * @param updateDto - Dữ liệu cập nhật
   * @param currentUser - Người dùng hiện tại
   * @returns AssetSoftwareResponseDto
   */
  async update(
    assetId: string,
    softwareId: string,
    updateDto: UpdateAssetSoftwareDto,
    currentUser: User
  ): Promise<AssetSoftwareResponseDto> {
    const assetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    if (!assetSoftware) {
      throw new NotFoundException(
        "Không tìm thấy phần mềm được cài đặt trên tài sản"
      );
    }

    // Cập nhật thông tin
    if (updateDto.installationDate !== undefined) {
      assetSoftware.installationDate = updateDto.installationDate
        ? new Date(updateDto.installationDate)
        : null;
    }

    if (updateDto.notes !== undefined) {
      assetSoftware.notes = updateDto.notes;
    }

    // Lưu thay đổi
    const updatedRecord =
      await this.assetSoftwareRepository.save(assetSoftware);

    // Lấy thông tin đầy đủ với relations
    const fullRecord = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    return this.transformToResponseDto(fullRecord);
  }

  /**
   * Gỡ phần mềm khỏi tài sản
   * @param assetId - ID tài sản
   * @param softwareId - ID phần mềm
   * @param currentUser - Người dùng hiện tại
   * @returns Thông báo thành công
   */
  async remove(
    assetId: string,
    softwareId: string,
    currentUser: User
  ): Promise<{ message: string }> {
    const assetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    if (!assetSoftware) {
      throw new NotFoundException(
        "Không tìm thấy phần mềm được cài đặt trên tài sản"
      );
    }

    await this.assetSoftwareRepository.remove(assetSoftware);

    return {
      message: `Đã gỡ phần mềm "${assetSoftware.software.name}" khỏi tài sản "${assetSoftware.asset.name}" thành công`,
    };
  }

  /**
   * Transform entity sang DTO response
   * @param assetSoftware - AssetSoftware entity
   * @returns AssetSoftwareResponseDto
   */
  private transformToResponseDto(
    assetSoftware: AssetSoftware
  ): AssetSoftwareResponseDto {
    const dto = plainToInstance(AssetSoftwareResponseDto, assetSoftware, {
      excludeExtraneousValues: true,
    });

    // Transform nested objects
    if (assetSoftware.asset) {
      dto.asset = {
        id: assetSoftware.asset.id,
        name: assetSoftware.asset.name,
        ktCode: assetSoftware.asset.ktCode,
        fixedCode: assetSoftware.asset.fixedCode,
        type: assetSoftware.asset.type,
        status: assetSoftware.asset.status,
      } as any;

      // Add room info if exists
      if (assetSoftware.asset.currentRoom) {
        dto.room = {
          id: assetSoftware.asset.currentRoom.id,
          name: assetSoftware.asset.currentRoom.name,
          building: assetSoftware.asset.currentRoom.building,
          floor: assetSoftware.asset.currentRoom.floor,
          roomNumber: assetSoftware.asset.currentRoom.roomNumber,
        } as any;
      }
    }

    if (assetSoftware.software) {
      dto.software = {
        id: assetSoftware.software.id,
        name: assetSoftware.software.name,
        version: assetSoftware.software.version,
        publisher: assetSoftware.software.publisher,
      } as any;
    }

    return dto;
  }

  /**
   * Tạo query builder với các điều kiện lọc
   * @param filter - Bộ lọc
   * @returns SelectQueryBuilder<AssetSoftware>
   */
  private createQueryBuilder(
    filter: AssetSoftwareFilterDto
  ): SelectQueryBuilder<AssetSoftware> {
    const queryBuilder = this.assetSoftwareRepository
      .createQueryBuilder("assetSoftware")
      .leftJoinAndSelect("assetSoftware.asset", "asset")
      .leftJoinAndSelect("assetSoftware.software", "software")
      .leftJoinAndSelect("asset.currentRoom", "room");

    // Lọc theo assetId
    if (filter.assetId) {
      queryBuilder.andWhere("assetSoftware.assetId = :assetId", {
        assetId: filter.assetId,
      });
    }

    // Lọc theo softwareId
    if (filter.softwareId) {
      queryBuilder.andWhere("assetSoftware.softwareId = :softwareId", {
        softwareId: filter.softwareId,
      });
    }

    // Tìm kiếm theo tên tài sản hoặc tên phần mềm
    if (filter.search) {
      queryBuilder.andWhere(
        "(asset.name ILIKE :search OR software.name ILIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    // Lọc tài sản chưa bị xóa
    queryBuilder.andWhere("asset.deletedAt IS NULL");
    queryBuilder.andWhere("software.deletedAt IS NULL");

    // Sắp xếp
    const sortBy = filter.sortBy || "installationDate";
    const sortOrder = (filter.sortOrder || "DESC") as "ASC" | "DESC";

    if (sortBy === "assetName") {
      queryBuilder.orderBy("asset.name", sortOrder);
    } else if (sortBy === "softwareName") {
      queryBuilder.orderBy("software.name", sortOrder);
    } else {
      queryBuilder.orderBy(`assetSoftware.${sortBy}`, sortOrder);
    }

    return queryBuilder;
  }
}
