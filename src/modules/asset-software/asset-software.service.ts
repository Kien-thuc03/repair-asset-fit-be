import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { AssetSoftware } from "src/entities/asset-software.entity";
import { Asset } from "src/entities/asset.entity";
import { Software } from "src/entities/software.entity";
import { CreateAssetSoftwareDto } from "./dto/create-asset-software.dto";
import { UpdateAssetSoftwareDto } from "./dto/update-asset-software.dto";
import { AssetSoftwareFilterDto } from "./dto/asset-software-filter.dto";
import { AssetSoftwareResponseDto } from "./dto/asset-software-response.dto";
import { PaginatedResponseDto } from "src/common/dto/pagination.dto";
import { ResponseDto } from "./interfaces/response.interface";

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
   * Thêm phần mềm vào máy tính
   */
  async addSoftwareToAsset(
    createAssetSoftwareDto: CreateAssetSoftwareDto
  ): Promise<ResponseDto<AssetSoftwareResponseDto>> {
    const { assetId, softwareId, installationDate, notes } =
      createAssetSoftwareDto;

    // Kiểm tra tài sản có tồn tại không
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
      select: ["id", "name", "ktCode", "fixedCode"],
    });

    if (!asset) {
      throw new NotFoundException(`Không tìm thấy tài sản với ID: ${assetId}`);
    }

    // Kiểm tra phần mềm có tồn tại không
    const software = await this.softwareRepository.findOne({
      where: { id: softwareId },
      select: ["id", "name", "version", "publisher"],
    });

    if (!software) {
      throw new NotFoundException(
        `Không tìm thấy phần mềm với ID: ${softwareId}`
      );
    }

    // Kiểm tra phần mềm đã được cài trên tài sản này chưa
    const existingAssetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
    });

    if (existingAssetSoftware) {
      throw new ConflictException(
        `Phần mềm "${software.name}" đã được cài đặt trên tài sản "${asset.name}"`
      );
    }

    // Tạo mới AssetSoftware
    const assetSoftware = this.assetSoftwareRepository.create({
      assetId,
      softwareId,
      installationDate: installationDate
        ? new Date(installationDate)
        : undefined,
      notes,
    });

    await this.assetSoftwareRepository.save(assetSoftware);

    const response: AssetSoftwareResponseDto = {
      assetId: assetSoftware.assetId,
      softwareId: assetSoftware.softwareId,
      installationDate: assetSoftware.installationDate
        ?.toISOString()
        .split("T")[0],
      notes: assetSoftware.notes,
      asset: {
        id: asset.id,
        name: asset.name,
        ktCode: asset.ktCode,
        fixedCode: asset.fixedCode,
      },
      software: {
        id: software.id,
        name: software.name,
        version: software.version,
        publisher: software.publisher,
      },
    };

    return {
      success: true,
      message: `Đã thêm phần mềm "${software.name}" vào tài sản "${asset.name}" thành công`,
      data: response,
    };
  }

  /**
   * Cập nhật thông tin cài đặt phần mềm
   */
  async updateAssetSoftware(
    assetId: string,
    softwareId: string,
    updateAssetSoftwareDto: UpdateAssetSoftwareDto
  ): Promise<ResponseDto<AssetSoftwareResponseDto>> {
    const assetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    if (!assetSoftware) {
      throw new NotFoundException(
        `Không tìm thấy phần mềm được cài đặt trên tài sản với assetId: ${assetId}, softwareId: ${softwareId}`
      );
    }

    // Cập nhật thông tin
    if (updateAssetSoftwareDto.installationDate !== undefined) {
      assetSoftware.installationDate = updateAssetSoftwareDto.installationDate
        ? new Date(updateAssetSoftwareDto.installationDate)
        : undefined;
    }

    if (updateAssetSoftwareDto.notes !== undefined) {
      assetSoftware.notes = updateAssetSoftwareDto.notes;
    }

    await this.assetSoftwareRepository.save(assetSoftware);

    const response: AssetSoftwareResponseDto = {
      assetId: assetSoftware.assetId,
      softwareId: assetSoftware.softwareId,
      installationDate: assetSoftware.installationDate
        ?.toISOString()
        .split("T")[0],
      notes: assetSoftware.notes,
      asset: {
        id: assetSoftware.asset.id,
        name: assetSoftware.asset.name,
        ktCode: assetSoftware.asset.ktCode,
        fixedCode: assetSoftware.asset.fixedCode,
      },
      software: {
        id: assetSoftware.software.id,
        name: assetSoftware.software.name,
        version: assetSoftware.software.version,
        publisher: assetSoftware.software.publisher,
      },
    };

    return {
      success: true,
      message: "Cập nhật thông tin cài đặt phần mềm thành công",
      data: response,
    };
  }

  /**
   * Xóa phần mềm khỏi tài sản
   */
  async removeSoftwareFromAsset(
    assetId: string,
    softwareId: string
  ): Promise<ResponseDto<void>> {
    const assetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    if (!assetSoftware) {
      throw new NotFoundException(
        `Không tìm thấy phần mềm được cài đặt trên tài sản với assetId: ${assetId}, softwareId: ${softwareId}`
      );
    }

    await this.assetSoftwareRepository.remove(assetSoftware);

    return {
      success: true,
      message: `Đã gỡ phần mềm "${assetSoftware.software.name}" khỏi tài sản "${assetSoftware.asset.name}" thành công`,
    };
  }

  /**
   * Lấy danh sách phần mềm được cài trên tài sản
   */
  async getAssetSoftwareList(
    filter: AssetSoftwareFilterDto
  ): Promise<ResponseDto<PaginatedResponseDto<AssetSoftwareResponseDto>>> {
    const queryBuilder = this.createQueryBuilder(filter);

    // Đếm tổng số records
    const totalItems = await queryBuilder.getCount();

    // Phân trang
    const { page, limit } = filter;
    if (page && limit) {
      queryBuilder.skip((page - 1) * limit).take(limit);
    }

    // Thực hiện query
    const assetSoftwareList = await queryBuilder.getMany();

    const data = assetSoftwareList.map((item) => ({
      assetId: item.assetId,
      softwareId: item.softwareId,
      installationDate: item.installationDate?.toISOString().split("T")[0],
      notes: item.notes,
      asset: {
        id: item.asset.id,
        name: item.asset.name,
        ktCode: item.asset.ktCode,
        fixedCode: item.asset.fixedCode,
      },
      software: {
        id: item.software.id,
        name: item.software.name,
        version: item.software.version,
        publisher: item.software.publisher,
      },
    }));

    const totalPages = limit ? Math.ceil(totalItems / limit) : 1;
    const currentPage = page || 1;

    const pagination = new PaginatedResponseDto(data, {
      page: currentPage,
      limit: limit || totalItems,
      total: totalItems,
      totalPages,
      hasNext: currentPage < totalPages,
      hasPrev: currentPage > 1,
    });

    return {
      success: true,
      message: "Lấy danh sách phần mềm được cài đặt thành công",
      data: pagination,
    };
  }

  /**
   * Lấy thông tin chi tiết một phần mềm được cài trên tài sản
   */
  async getAssetSoftwareDetail(
    assetId: string,
    softwareId: string
  ): Promise<ResponseDto<AssetSoftwareResponseDto>> {
    const assetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    if (!assetSoftware) {
      throw new NotFoundException(
        `Không tìm thấy phần mềm được cài đặt trên tài sản với assetId: ${assetId}, softwareId: ${softwareId}`
      );
    }

    const response: AssetSoftwareResponseDto = {
      assetId: assetSoftware.assetId,
      softwareId: assetSoftware.softwareId,
      installationDate: assetSoftware.installationDate
        ?.toISOString()
        .split("T")[0],
      notes: assetSoftware.notes,
      asset: {
        id: assetSoftware.asset.id,
        name: assetSoftware.asset.name,
        ktCode: assetSoftware.asset.ktCode,
        fixedCode: assetSoftware.asset.fixedCode,
      },
      software: {
        id: assetSoftware.software.id,
        name: assetSoftware.software.name,
        version: assetSoftware.software.version,
        publisher: assetSoftware.software.publisher,
      },
    };

    return {
      success: true,
      message: "Lấy thông tin chi tiết thành công",
      data: response,
    };
  }

  /**
   * Tạo query builder với các điều kiện lọc
   */
  private createQueryBuilder(
    filter: AssetSoftwareFilterDto
  ): SelectQueryBuilder<AssetSoftware> {
    const queryBuilder = this.assetSoftwareRepository
      .createQueryBuilder("assetSoftware")
      .leftJoinAndSelect("assetSoftware.asset", "asset")
      .leftJoinAndSelect("assetSoftware.software", "software");

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

    // Sắp xếp
    const sortBy = filter.sortBy || "installationDate";
    const sortOrder = filter.sortOrder || "DESC";

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
