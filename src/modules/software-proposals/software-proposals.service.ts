import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, DataSource } from "typeorm";
import { plainToInstance } from "class-transformer";
import { SoftwareProposal } from "src/entities/software-proposal.entity";
import { SoftwareProposalItem } from "src/entities/software-proposal-item.entity";
import { Room } from "src/entities/room.entity";
import { User } from "src/entities/user.entity";
import { Software } from "src/entities/software.entity";
import { CreateSoftwareProposalDto } from "./dto/create-software-proposal.dto";
import { UpdateSoftwareProposalDto } from "./dto/update-software-proposal.dto";
import { SoftwareProposalFilterDto } from "./dto/software-proposal-filter.dto";
import { SoftwareProposalResponseDto } from "./dto/software-proposal-response.dto";
import { SoftwareProposalStatus } from "src/common/shared/SoftwareProposalStatus";

@Injectable()
export class SoftwareProposalsService {
  constructor(
    @InjectRepository(SoftwareProposal)
    private readonly softwareProposalRepository: Repository<SoftwareProposal>,
    @InjectRepository(SoftwareProposalItem)
    private readonly softwareProposalItemRepository: Repository<SoftwareProposalItem>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(Software)
    private readonly softwareRepository: Repository<Software>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Tạo đề xuất phần mềm mới với nhiều phần mềm cùng lúc
   * @param createDto - Dữ liệu tạo đề xuất
   * @param currentUser - Người dùng hiện tại (người tạo đề xuất)
   * @returns SoftwareProposalResponseDto
   */
  async create(
    createDto: CreateSoftwareProposalDto,
    currentUser: User
  ): Promise<SoftwareProposalResponseDto> {
    // 1. Kiểm tra phòng có tồn tại không
    const room = await this.roomRepository.findOne({
      where: { id: createDto.roomId },
      relations: ["unit"],
    });

    if (!room) {
      throw new NotFoundException(
        `Không tìm thấy phòng với ID: ${createDto.roomId}`
      );
    }

    // 2. Kiểm tra phòng đã bị xóa chưa
    if (room.deletedAt) {
      throw new BadRequestException(
        "Phòng này đã bị xóa, không thể tạo đề xuất phần mềm"
      );
    }

    // 3. Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
    return await this.dataSource.transaction(async (manager) => {
      // 4. Tạo mã đề xuất tự động
      const proposalCode = await this.generateProposalCode();

      // 5. Tạo đề xuất chính
      const proposal = manager.create(SoftwareProposal, {
        proposalCode,
        proposerId: currentUser.id,
        roomId: createDto.roomId,
        reason: createDto.reason,
        status: SoftwareProposalStatus.CHỜ_DUYỆT,
      });

      const savedProposal = await manager.save(SoftwareProposal, proposal);

      // 6. Tạo các items cho đề xuất
      const items = createDto.items.map((item) =>
        manager.create(SoftwareProposalItem, {
          proposalId: savedProposal.id,
          softwareName: item.softwareName,
          version: item.version,
          publisher: item.publisher,
          quantity: item.quantity,
          licenseType: item.licenseType,
        })
      );

      await manager.save(SoftwareProposalItem, items);

      // 7. Lấy thông tin đầy đủ với relations
      const fullProposal = await manager.findOne(SoftwareProposal, {
        where: { id: savedProposal.id },
        relations: ["proposer", "room", "items"],
      });

      return this.transformToResponseDto(fullProposal);
    });
  }

  /**
   * Lấy danh sách đề xuất phần mềm với lọc và phân trang
   * @param filter - Bộ lọc và phân trang
   * @returns Danh sách đề xuất đã phân trang
   */
  async findAll(filter: SoftwareProposalFilterDto) {
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
   * Lấy thông tin chi tiết một đề xuất phần mềm
   * @param id - ID đề xuất
   * @returns SoftwareProposalResponseDto
   */
  async findOne(id: string): Promise<SoftwareProposalResponseDto> {
    const proposal = await this.softwareProposalRepository.findOne({
      where: { id },
      relations: ["proposer", "approver", "room", "room.unit", "items"],
    });

    if (!proposal) {
      throw new NotFoundException(
        `Không tìm thấy đề xuất phần mềm với ID: ${id}`
      );
    }

    return this.transformToResponseDto(proposal);
  }

  /**
   * Cập nhật thông tin đề xuất phần mềm
   * @param id - ID đề xuất
   * @param updateDto - Dữ liệu cập nhật
   * @param currentUser - Người dùng hiện tại
   * @returns SoftwareProposalResponseDto
   */
  async update(
    id: string,
    updateDto: UpdateSoftwareProposalDto,
    currentUser: User
  ): Promise<SoftwareProposalResponseDto> {
    const proposal = await this.softwareProposalRepository.findOne({
      where: { id },
      relations: ["proposer"],
    });

    if (!proposal) {
      throw new NotFoundException(
        `Không tìm thấy đề xuất phần mềm với ID: ${id}`
      );
    }

    // Kiểm tra quyền: chỉ người tạo hoặc admin mới được sửa
    if (proposal.proposerId !== currentUser.id && !this.isAdmin(currentUser)) {
      throw new ForbiddenException("Bạn không có quyền chỉnh sửa đề xuất này");
    }

    // Kiểm tra trạng thái: chỉ được sửa khi đang CHỜ_DUYỆT
    if (
      proposal.status !== SoftwareProposalStatus.CHỜ_DUYỆT &&
      updateDto.status !== proposal.status
    ) {
      throw new BadRequestException(
        "Chỉ có thể chỉnh sửa đề xuất khi đang ở trạng thái CHỜ_DUYỆT"
      );
    }

    // Nếu cập nhật roomId, kiểm tra phòng mới có tồn tại không
    if (updateDto.roomId && updateDto.roomId !== proposal.roomId) {
      const room = await this.roomRepository.findOne({
        where: { id: updateDto.roomId },
      });

      if (!room) {
        throw new NotFoundException(
          `Không tìm thấy phòng với ID: ${updateDto.roomId}`
        );
      }

      if (room.deletedAt) {
        throw new BadRequestException(
          "Phòng này đã bị xóa, không thể chuyển đề xuất sang"
        );
      }
    }

    // Cập nhật thông tin
    Object.assign(proposal, updateDto);

    // Nếu cập nhật trạng thái thành ĐÃ_DUYỆT hoặc ĐÃ_TỪ_CHỐI, cập nhật approverId
    if (
      updateDto.status &&
      (updateDto.status === SoftwareProposalStatus.ĐÃ_DUYỆT ||
        updateDto.status === SoftwareProposalStatus.ĐÃ_TỪ_CHỐI)
    ) {
      proposal.approverId = currentUser.id;
    }

    const updatedProposal =
      await this.softwareProposalRepository.save(proposal);

    // Lấy thông tin đầy đủ với relations
    const fullProposal = await this.softwareProposalRepository.findOne({
      where: { id },
      relations: ["proposer", "approver", "room", "room.unit", "items"],
    });

    return this.transformToResponseDto(fullProposal);
  }

  /**
   * Duyệt đề xuất phần mềm
   * @param id - ID đề xuất
   * @param currentUser - Người duyệt
   * @returns SoftwareProposalResponseDto
   */
  async approve(
    id: string,
    currentUser: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.update(
      id,
      { status: SoftwareProposalStatus.ĐÃ_DUYỆT },
      currentUser
    );
  }

  /**
   * Từ chối đề xuất phần mềm
   * @param id - ID đề xuất
   * @param currentUser - Người từ chối
   * @returns SoftwareProposalResponseDto
   */
  async reject(
    id: string,
    currentUser: User
  ): Promise<SoftwareProposalResponseDto> {
    return this.update(
      id,
      { status: SoftwareProposalStatus.ĐÃ_TỪ_CHỐI },
      currentUser
    );
  }

  /**
   * Đánh dấu đề xuất đã trang bị xong
   * @param id - ID đề xuất
   * @param currentUser - Người cập nhật
   * @returns SoftwareProposalResponseDto
   */
  async markEquipped(
    id: string,
    currentUser: User
  ): Promise<SoftwareProposalResponseDto> {
    const proposal = await this.softwareProposalRepository.findOne({
      where: { id },
    });

    if (!proposal) {
      throw new NotFoundException(
        `Không tìm thấy đề xuất phần mềm với ID: ${id}`
      );
    }

    if (proposal.status !== SoftwareProposalStatus.ĐÃ_DUYỆT) {
      throw new BadRequestException(
        "Chỉ có thể đánh dấu trang bị cho đề xuất đã được duyệt"
      );
    }

    return this.update(
      id,
      { status: SoftwareProposalStatus.ĐÃ_TRANG_BỊ },
      currentUser
    );
  }

  /**
   * Xóa đề xuất phần mềm
   * @param id - ID đề xuất
   * @param currentUser - Người dùng hiện tại
   * @returns Thông báo thành công
   */
  async remove(id: string, currentUser: User): Promise<{ message: string }> {
    const proposal = await this.softwareProposalRepository.findOne({
      where: { id },
      relations: ["proposer", "items"],
    });

    if (!proposal) {
      throw new NotFoundException(
        `Không tìm thấy đề xuất phần mềm với ID: ${id}`
      );
    }

    // Kiểm tra quyền: chỉ người tạo hoặc admin mới được xóa
    if (proposal.proposerId !== currentUser.id && !this.isAdmin(currentUser)) {
      throw new ForbiddenException("Bạn không có quyền xóa đề xuất này");
    }

    // Kiểm tra trạng thái: chỉ được xóa khi đang CHỜ_DUYỆT hoặc ĐÃ_TỪ_CHỐI
    if (
      ![
        SoftwareProposalStatus.CHỜ_DUYỆT,
        SoftwareProposalStatus.ĐÃ_TỪ_CHỐI,
      ].includes(proposal.status)
    ) {
      throw new BadRequestException(
        "Chỉ có thể xóa đề xuất ở trạng thái CHỜ_DUYỆT hoặc ĐÃ_TỪ_CHỐI"
      );
    }

    // Xóa cascade sẽ tự động xóa các items
    await this.softwareProposalRepository.remove(proposal);

    return {
      message: `Đã xóa đề xuất phần mềm "${proposal.proposalCode}" thành công`,
    };
  }

  /**
   * Sinh mã đề xuất tự động theo format DXPM-YYYY-NNNN
   * @returns Promise<string>
   */
  private async generateProposalCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `DXPM-${currentYear}-`;

    // Tìm mã cuối cùng trong năm
    const lastProposal = await this.softwareProposalRepository
      .createQueryBuilder("proposal")
      .where("proposal.proposalCode LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy("proposal.proposalCode", "DESC")
      .getOne();

    let sequence = 1;
    if (lastProposal) {
      const lastSequence = parseInt(
        lastProposal.proposalCode.replace(prefix, "")
      );
      sequence = lastSequence + 1;
    }

    return `${prefix}${sequence.toString().padStart(4, "0")}`;
  }

  /**
   * Kiểm tra user có phải admin không
   * @param user - User cần kiểm tra
   * @returns boolean
   */
  private isAdmin(user: User): boolean {
    // TODO: Implement admin role check
    // Có thể kiểm tra qua user.roles hoặc permissions
    return user.roles?.some((role) => role.name === "ADMIN") || false;
  }

  /**
   * Transform entity sang DTO response
   * @param proposal - SoftwareProposal entity
   * @returns SoftwareProposalResponseDto
   */
  private transformToResponseDto(
    proposal: SoftwareProposal
  ): SoftwareProposalResponseDto {
    const dto = plainToInstance(SoftwareProposalResponseDto, proposal, {
      excludeExtraneousValues: true,
    });

    // Transform nested objects
    if (proposal.proposer) {
      dto.proposer = {
        id: proposal.proposer.id,
        fullName: proposal.proposer.fullName,
        email: proposal.proposer.email,
        unitName: proposal.proposer.unit?.name || "",
      } as any;
    }

    if (proposal.approver) {
      dto.approver = {
        id: proposal.approver.id,
        fullName: proposal.approver.fullName,
        email: proposal.approver.email,
        unitName: proposal.approver.unit?.name || "",
      } as any;
    }

    if (proposal.room) {
      dto.room = {
        id: proposal.room.id,
        name: proposal.room.name,
        building: proposal.room.building,
        floor: proposal.room.floor,
        roomNumber: proposal.room.roomNumber,
      } as any;
    }

    if (proposal.items) {
      dto.items = proposal.items.map((item) => ({
        id: item.id,
        softwareName: item.softwareName,
        version: item.version,
        publisher: item.publisher,
        quantity: item.quantity,
        licenseType: item.licenseType,
        newlyAcquiredSoftwareId: item.newlyAcquiredSoftwareId,
      })) as any;
    }

    return dto;
  }

  /**
   * Tạo query builder với các điều kiện lọc
   * @param filter - Bộ lọc
   * @returns SelectQueryBuilder<SoftwareProposal>
   */
  private createQueryBuilder(
    filter: SoftwareProposalFilterDto
  ): SelectQueryBuilder<SoftwareProposal> {
    const queryBuilder = this.softwareProposalRepository
      .createQueryBuilder("proposal")
      .leftJoinAndSelect("proposal.proposer", "proposer")
      .leftJoinAndSelect("proposal.approver", "approver")
      .leftJoinAndSelect("proposal.room", "room")
      .leftJoinAndSelect("proposal.items", "items");

    // Lọc theo roomId
    if (filter.roomId) {
      queryBuilder.andWhere("proposal.roomId = :roomId", {
        roomId: filter.roomId,
      });
    }

    // Lọc theo proposerId
    if (filter.proposerId) {
      queryBuilder.andWhere("proposal.proposerId = :proposerId", {
        proposerId: filter.proposerId,
      });
    }

    // Lọc theo approverId
    if (filter.approverId) {
      queryBuilder.andWhere("proposal.approverId = :approverId", {
        approverId: filter.approverId,
      });
    }

    // Lọc theo status
    if (filter.status) {
      queryBuilder.andWhere("proposal.status = :status", {
        status: filter.status,
      });
    }

    // Tìm kiếm theo proposalCode hoặc reason
    if (filter.search) {
      queryBuilder.andWhere(
        "(proposal.proposalCode ILIKE :search OR proposal.reason ILIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    // Lọc theo khoảng thời gian
    if (filter.fromDate) {
      queryBuilder.andWhere("proposal.createdAt >= :fromDate", {
        fromDate: new Date(filter.fromDate),
      });
    }

    if (filter.toDate) {
      queryBuilder.andWhere("proposal.createdAt <= :toDate", {
        toDate: new Date(filter.toDate),
      });
    }

    // Sắp xếp
    const sortBy = filter.sortBy || "createdAt";
    const sortOrder = (filter.sortOrder || "DESC") as "ASC" | "DESC";

    queryBuilder.orderBy(`proposal.${sortBy}`, sortOrder);

    return queryBuilder;
  }
}
