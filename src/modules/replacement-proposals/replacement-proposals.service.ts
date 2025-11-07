import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between, DataSource, In } from "typeorm";
import { ReplacementProposal } from "../../entities/replacement-proposal.entity";
import { ReplacementItem } from "../../entities/replacement-item.entity";
import { RepairRequest } from "../../entities/repair-request.entity";
import { ReplacementProposalFilterDto } from "./dto/replacement-proposal-filter.dto";
import { ReplacementProposalResponseDto } from "./dto/replacement-proposal-response.dto";
import { UpdateReplacementProposalStatusDto } from "./dto/update-replacement-proposal-status.dto";
import { CreateReplacementProposalDto } from "./dto/create-replacement-proposal.dto";
import {
  ComponentFromRepairDto,
  ComponentFromRepairFilterDto,
} from "./dto/component-from-repair.dto";
import { ReplacementStatus } from "../../common/shared/ReplacementStatus";
import { RepairStatus } from "../../common/shared/RepairStatus";
import { User } from "../../entities/user.entity";

@Injectable()
export class ReplacementProposalsService {
  constructor(
    @InjectRepository(ReplacementProposal)
    private replacementProposalRepository: Repository<ReplacementProposal>,
    @InjectRepository(ReplacementItem)
    private replacementItemRepository: Repository<ReplacementItem>,
    @InjectRepository(RepairRequest)
    private repairRequestRepository: Repository<RepairRequest>,
    private dataSource: DataSource
  ) {}

  /**
   * Tạo đề xuất thay thế mới
   */
  async create(
    createDto: CreateReplacementProposalDto,
    currentUser: User
  ): Promise<ReplacementProposalResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Generate proposal code
      const proposalCode = await this.generateProposalCode();

      // Create proposal
      const proposal = this.replacementProposalRepository.create({
        title: createDto.title,
        description: createDto.description,
        proposalCode,
        proposerId: currentUser.id,
        status: ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT,
      });

      const savedProposal = await queryRunner.manager.save(proposal);

      // Create items
      const items = createDto.items.map((itemDto) =>
        this.replacementItemRepository.create({
          proposalId: savedProposal.id,
          oldComponentId: itemDto.oldComponentId,
          newItemName: itemDto.newItemName,
          newItemSpecs: itemDto.newItemSpecs,
          quantity: itemDto.quantity,
          reason: itemDto.reason,
        })
      );

      await queryRunner.manager.save(items);

      await queryRunner.commitTransaction();

      // Return the created proposal with all relations
      return this.findOne(savedProposal.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generate unique proposal code
   */
  private async generateProposalCode(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `DXTT-${year}`;

    // Find the latest proposal code for this year
    const latestProposal = await this.replacementProposalRepository
      .createQueryBuilder("proposal")
      .where("proposal.proposalCode LIKE :prefix", { prefix: `${prefix}-%` })
      .orderBy("proposal.createdAt", "DESC")
      .getOne();

    let nextNumber = 1;

    if (latestProposal) {
      // Extract number from code like "DXTT-2025-0001"
      const match = latestProposal.proposalCode.match(/DXTT-\d{4}-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    // Format: DXTT-2025-0001
    const paddedNumber = nextNumber.toString().padStart(4, "0");
    return `${prefix}-${paddedNumber}`;
  }

  /**
   * Lấy danh sách đề xuất thay thế với filter và phân trang
   */
  async findAll(filter: ReplacementProposalFilterDto) {
    const {
      proposerId,
      teamLeadApproverId,
      adminVerifierId,
      status,
      search,
      fromDate,
      toDate,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = filter;

    const queryBuilder = this.replacementProposalRepository
      .createQueryBuilder("proposal")
      .leftJoinAndSelect("proposal.proposer", "proposer")
      .leftJoinAndSelect("proposal.teamLeadApprover", "teamLeadApprover")
      .leftJoinAndSelect("proposal.adminVerifier", "adminVerifier")
      .leftJoinAndSelect("proposal.items", "items")
      .leftJoinAndSelect("items.oldComponent", "oldComponent")
      .leftJoinAndSelect("oldComponent.computer", "computer")
      .leftJoinAndSelect("computer.room", "room")
      .leftJoinAndSelect(
        "items.newlyPurchasedComponent",
        "newlyPurchasedComponent"
      );

    // Filter by proposer
    if (proposerId) {
      queryBuilder.andWhere("proposal.proposerId = :proposerId", {
        proposerId,
      });
    }

    // Filter by team lead approver
    if (teamLeadApproverId) {
      queryBuilder.andWhere(
        "proposal.teamLeadApproverId = :teamLeadApproverId",
        {
          teamLeadApproverId,
        }
      );
    }

    // Filter by admin verifier
    if (adminVerifierId) {
      queryBuilder.andWhere("proposal.adminVerifierId = :adminVerifierId", {
        adminVerifierId,
      });
    }

    // Filter by status
    if (status) {
      queryBuilder.andWhere("proposal.status = :status", { status });
    }

    // Search by proposal code or title
    if (search) {
      queryBuilder.andWhere(
        "(proposal.proposalCode ILIKE :search OR proposal.title ILIKE :search OR proposal.description ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Filter by date range
    if (fromDate && toDate) {
      queryBuilder.andWhere(
        "proposal.createdAt BETWEEN :fromDate AND :toDate",
        {
          fromDate: new Date(fromDate),
          toDate: new Date(toDate),
        }
      );
    } else if (fromDate) {
      queryBuilder.andWhere("proposal.createdAt >= :fromDate", {
        fromDate: new Date(fromDate),
      });
    } else if (toDate) {
      queryBuilder.andWhere("proposal.createdAt <= :toDate", {
        toDate: new Date(toDate),
      });
    }

    // Sorting
    const allowedSortFields = [
      "createdAt",
      "updatedAt",
      "proposalCode",
      "status",
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    queryBuilder.orderBy(`proposal.${sortField}`, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data: data.map((proposal) => this.mapToResponseDto(proposal)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy chi tiết một đề xuất thay thế
   */
  async findOne(id: string): Promise<ReplacementProposalResponseDto> {
    const proposal = await this.replacementProposalRepository.findOne({
      where: { id },
      relations: [
        "proposer",
        "teamLeadApprover",
        "adminVerifier",
        "items",
        "items.oldComponent",
        "items.oldComponent.computer",
        "items.oldComponent.computer.room",
        "items.newlyPurchasedComponent",
      ],
    });

    if (!proposal) {
      throw new NotFoundException(
        `Không tìm thấy đề xuất thay thế với ID: ${id}`
      );
    }

    return this.mapToResponseDto(proposal);
  }

  /**
   * Cập nhật trạng thái đề xuất thay thế
   */
  async updateStatus(
    id: string,
    updateDto: UpdateReplacementProposalStatusDto,
    currentUser: User
  ): Promise<ReplacementProposalResponseDto> {
    const proposal = await this.replacementProposalRepository.findOne({
      where: { id },
      relations: ["proposer", "teamLeadApprover", "adminVerifier"],
    });

    if (!proposal) {
      throw new NotFoundException(
        `Không tìm thấy đề xuất thay thế với ID: ${id}`
      );
    }

    // Validate status transition
    this.validateStatusTransition(proposal.status, updateDto.status);

    // Update status
    proposal.status = updateDto.status;

    // Auto-set approver/verifier based on status and current user
    if (
      updateDto.status === ReplacementStatus.ĐÃ_DUYỆT ||
      updateDto.status === ReplacementStatus.ĐÃ_TỪ_CHỐI
    ) {
      proposal.teamLeadApproverId =
        updateDto.teamLeadApproverId || currentUser.id;
    }

    if (
      updateDto.status === ReplacementStatus.ĐÃ_XÁC_MINH ||
      updateDto.status === ReplacementStatus.ĐÃ_GỬI_BIÊN_BẢN ||
      updateDto.status === ReplacementStatus.ĐÃ_KÝ_BIÊN_BẢN
    ) {
      proposal.adminVerifierId = updateDto.adminVerifierId || currentUser.id;
    }

    // Update URLs if provided
    if (updateDto.submissionFormUrl !== undefined) {
      proposal.submissionFormUrl = updateDto.submissionFormUrl;
    }

    if (updateDto.verificationReportUrl !== undefined) {
      proposal.verificationReportUrl = updateDto.verificationReportUrl;
    }

    await this.replacementProposalRepository.save(proposal);

    return this.findOne(id);
  }

  /**
   * Lấy danh sách đề xuất theo người đề xuất
   */
  async findByProposer(
    proposerId: string
  ): Promise<ReplacementProposalResponseDto[]> {
    const proposals = await this.replacementProposalRepository.find({
      where: { proposerId },
      relations: [
        "proposer",
        "teamLeadApprover",
        "adminVerifier",
        "items",
        "items.oldComponent",
        "items.newlyPurchasedComponent",
      ],
      order: { createdAt: "DESC" },
    });

    return proposals.map((proposal) => this.mapToResponseDto(proposal));
  }

  /**
   * Lấy danh sách linh kiện từ các yêu cầu sửa chữa mà kỹ thuật viên đảm nhận
   * Dùng để kỹ thuật viên chọn linh kiện khi lập đề xuất thay thế
   * Chỉ lấy các yêu cầu sửa chữa được phân công cho kỹ thuật viên hiện tại
   */
  async getComponentsFromRepairRequests(
    filter: ComponentFromRepairFilterDto,
    currentUser: User
  ) {
    const {
      repairStatus,
      componentType,
      search,
      building,
      roomName,
      excludeInProposal = true,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = filter;

    // Build the query
    const queryBuilder = this.repairRequestRepository
      .createQueryBuilder("rr")
      .leftJoin("rr.components", "cc")
      .leftJoin("rr.computerAsset", "a")
      .leftJoin("a.computer", "c")
      .leftJoin("a.currentRoom", "r")
      .select([
        "rr.id as repairRequestId",
        'rr."requestCode" as requestCode',
        "rr.status as repairStatus",
        "rr.description as repairDescription",
        'rr."createdAt" as createdAt',
        "cc.id as componentId",
        "cc.name as componentName",
        'cc."componentType" as componentType',
        'cc."componentSpecs" as componentSpecs',
        "a.id as assetId",
        "a.name as assetName",
        "a.fixed_code as assetCode",
        "r.name as roomName",
        "r.building as buildingName",
        'c."machineLabel" as machineLabel',
      ])
      .where("cc.id IS NOT NULL") // Only get repair requests with components
      .andWhere('rr."assignedTechnicianId" = :technicianId', {
        technicianId: currentUser.id,
      }); // Chỉ lấy yêu cầu được phân công cho kỹ thuật viên hiện tại

    // Filter by repair status
    if (repairStatus && repairStatus.length > 0) {
      queryBuilder.andWhere("rr.status IN (:...repairStatus)", {
        repairStatus,
      });
    } else {
      // Mặc định chỉ lấy các yêu cầu đã tiếp nhận hoặc đang xử lý
      queryBuilder.andWhere("rr.status IN (:...defaultStatuses)", {
        defaultStatuses: [RepairStatus.ĐÃ_TIẾP_NHẬN, RepairStatus.ĐANG_XỬ_LÝ],
      });
    }

    // Filter by component type
    if (componentType && componentType.length > 0) {
      queryBuilder.andWhere('cc."componentType" IN (:...componentType)', {
        componentType,
      });
    }

    // Search by component name, asset name, or asset code
    if (search) {
      queryBuilder.andWhere(
        "(cc.name ILIKE :search OR a.name ILIKE :search OR a.fixed_code ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    // Filter by building
    if (building) {
      queryBuilder.andWhere("r.building = :building", { building });
    }

    // Filter by room
    if (roomName) {
      queryBuilder.andWhere("r.name = :roomName", { roomName });
    }

    // Exclude components already in replacement proposals
    if (excludeInProposal) {
      queryBuilder.andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('ri."oldComponentId"')
          .from("replacement_items", "ri")
          .where('ri."oldComponentId" IS NOT NULL')
          .getQuery();
        return `cc.id NOT IN ${subQuery}`;
      });
    }

    // Get total count before pagination
    const totalQuery = await queryBuilder.getRawMany();
    const total = totalQuery.length;

    // Sorting
    const allowedSortFields = [
      "createdAt",
      "componentName",
      "assetName",
      "requestCode",
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    // Map sortBy to actual column names
    let orderByField = 'rr."createdAt"';
    switch (sortField) {
      case "componentName":
        orderByField = "cc.name";
        break;
      case "assetName":
        orderByField = "a.name";
        break;
      case "requestCode":
        orderByField = 'rr."requestCode"';
        break;
      default:
        orderByField = 'rr."createdAt"';
    }

    queryBuilder.orderBy(orderByField, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.offset(skip).limit(limit);

    const rawResults = await queryBuilder.getRawMany();

    // Map to DTO
    const data: ComponentFromRepairDto[] = rawResults.map((row) => ({
      repairRequestId: row.repairrequestid,
      requestCode: row.requestcode,
      repairStatus: row.repairstatus,
      repairDescription: row.repairdescription,
      componentId: row.componentid,
      componentName: row.componentname,
      componentType: row.componenttype,
      componentSpecs: row.componentspecs,
      assetId: row.assetid,
      assetName: row.assetname,
      assetCode: row.assetcode,
      roomName: row.roomname,
      buildingName: row.buildingname,
      machineLabel: row.machinelabel,
      reason: row.repairdescription, // Sử dụng description của repair request làm reason
      quantity: 1, // Mặc định 1
      createdAt: row.createdat,
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Validate status transition
   */
  private validateStatusTransition(
    currentStatus: ReplacementStatus,
    newStatus: ReplacementStatus
  ) {
    const validTransitions: Record<ReplacementStatus, ReplacementStatus[]> = {
      [ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT]: [
        ReplacementStatus.ĐÃ_DUYỆT,
        ReplacementStatus.ĐÃ_TỪ_CHỐI,
      ],
      [ReplacementStatus.ĐÃ_DUYỆT]: [
        ReplacementStatus.ĐÃ_LẬP_TỜ_TRÌNH,
        ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT, // Allow re-submit
      ],
      [ReplacementStatus.ĐÃ_TỪ_CHỐI]: [
        ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT, // Allow re-submit
      ],
      [ReplacementStatus.ĐÃ_LẬP_TỜ_TRÌNH]: [
        ReplacementStatus.ĐÃ_DUYỆT_TỜ_TRÌNH,
        ReplacementStatus.ĐÃ_TỪ_CHỐI_TỜ_TRÌNH,
      ],
      [ReplacementStatus.ĐÃ_DUYỆT_TỜ_TRÌNH]: [ReplacementStatus.CHỜ_XÁC_MINH],
      [ReplacementStatus.ĐÃ_TỪ_CHỐI_TỜ_TRÌNH]: [
        ReplacementStatus.ĐÃ_LẬP_TỜ_TRÌNH, // Allow re-submit
      ],
      [ReplacementStatus.CHỜ_XÁC_MINH]: [ReplacementStatus.ĐÃ_XÁC_MINH],
      [ReplacementStatus.ĐÃ_XÁC_MINH]: [ReplacementStatus.ĐÃ_GỬI_BIÊN_BẢN],
      [ReplacementStatus.ĐÃ_GỬI_BIÊN_BẢN]: [ReplacementStatus.ĐÃ_KÝ_BIÊN_BẢN],
      [ReplacementStatus.ĐÃ_KÝ_BIÊN_BẢN]: [
        ReplacementStatus.ĐÃ_HOÀN_TẤT_MUA_SẮM,
      ],
      [ReplacementStatus.ĐÃ_HOÀN_TẤT_MUA_SẮM]: [], // Final state
    };

    const allowedTransitions = validTransitions[currentStatus] || [];

    if (!allowedTransitions.includes(newStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ trạng thái "${currentStatus}" sang "${newStatus}". ` +
          `Các trạng thái hợp lệ: ${allowedTransitions.join(", ") || "Không có"}`
      );
    }
  }

  /**
   * Map entity to response DTO
   */
  private mapToResponseDto(
    proposal: ReplacementProposal
  ): ReplacementProposalResponseDto {
    return {
      id: proposal.id,
      title: proposal.title,
      description: proposal.description,
      proposalCode: proposal.proposalCode,
      proposerId: proposal.proposerId,
      proposer: proposal.proposer
        ? {
            id: proposal.proposer.id,
            username: proposal.proposer.username,
            fullName: proposal.proposer.fullName,
            email: proposal.proposer.email,
          }
        : undefined,
      teamLeadApproverId: proposal.teamLeadApproverId,
      teamLeadApprover: proposal.teamLeadApprover
        ? {
            id: proposal.teamLeadApprover.id,
            username: proposal.teamLeadApprover.username,
            fullName: proposal.teamLeadApprover.fullName,
            email: proposal.teamLeadApprover.email,
          }
        : undefined,
      adminVerifierId: proposal.adminVerifierId,
      adminVerifier: proposal.adminVerifier
        ? {
            id: proposal.adminVerifier.id,
            username: proposal.adminVerifier.username,
            fullName: proposal.adminVerifier.fullName,
            email: proposal.adminVerifier.email,
          }
        : undefined,
      status: proposal.status,
      submissionFormUrl: proposal.submissionFormUrl,
      verificationReportUrl: proposal.verificationReportUrl,
      createdAt: proposal.createdAt,
      updatedAt: proposal.updatedAt,
      items: proposal.items?.map((item) => {
        const room = item.oldComponent?.computer?.room;
        const roomLocation = room
          ? `${room.building || ""} - ${room.roomNumber || ""}`.trim()
          : undefined;

        return {
          id: item.id,
          proposalId: item.proposalId,
          oldComponentId: item.oldComponentId,
          oldComponent: item.oldComponent
            ? {
                id: item.oldComponent.id,
                componentType: item.oldComponent.componentType,
                name: item.oldComponent.name,
                componentSpecs: item.oldComponent.componentSpecs,
                status: item.oldComponent.status,
                roomLocation,
              }
            : undefined,
          newItemName: item.newItemName,
          newItemSpecs: item.newItemSpecs,
          quantity: item.quantity,
          reason: item.reason,
          newlyPurchasedComponentId: item.newlyPurchasedComponentId,
          newlyPurchasedComponent: item.newlyPurchasedComponent
            ? {
                id: item.newlyPurchasedComponent.id,
                componentType: item.newlyPurchasedComponent.componentType,
                name: item.newlyPurchasedComponent.name,
                componentSpecs: item.newlyPurchasedComponent.componentSpecs,
              }
            : undefined,
        };
      }),
      itemsCount: proposal.items?.length || 0,
    };
  }
}
