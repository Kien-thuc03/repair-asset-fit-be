import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, Like, Between, DataSource, In } from "typeorm";
import { ReplacementProposal } from "../../entities/replacement-proposal.entity";
import { ReplacementItem } from "../../entities/replacement-item.entity";
import { RepairRequest } from "../../entities/repair-request.entity";
import { ComputerComponent } from "../../entities/computer-component.entity";
import { ReplacementProposalFilterDto } from "./dto/replacement-proposal-filter.dto";
import { ReplacementProposalResponseDto } from "./dto/replacement-proposal-response.dto";
import { UpdateReplacementProposalStatusDto } from "./dto/update-replacement-proposal-status.dto";
import { CreateReplacementProposalDto } from "./dto/create-replacement-proposal.dto";
import { ReplacementStatus } from "../../common/shared/ReplacementStatus";
import { RepairStatus } from "../../common/shared/RepairStatus";
import { ComponentStatus } from "../../common/shared/ComponentStatus";
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
    @InjectRepository(ComputerComponent)
    private computerComponentRepository: Repository<ComputerComponent>,
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

      // ⚠️ QUAN TRỌNG: Cập nhật trạng thái linh kiện cũ sang PENDING_REPLACEMENT
      // Các linh kiện được đưa vào đề xuất thay thế cần được đánh dấu là đang chờ thay thế
      const oldComponentIds = createDto.items
        .map((item) => item.oldComponentId)
        .filter((id) => id !== undefined && id !== null);

      if (oldComponentIds.length > 0) {
        const oldComponents = await queryRunner.manager.find(
          ComputerComponent,
          {
            where: { id: In(oldComponentIds as string[]) },
          }
        );

        for (const component of oldComponents) {
          // Chỉ cập nhật nếu component đang ở trạng thái FAULTY
          // Chuyển sang PENDING_REPLACEMENT để đánh dấu đang trong đề xuất
          if (component.status === ComponentStatus.FAULTY) {
            component.status = ComponentStatus.PENDING_REPLACEMENT;
            await queryRunner.manager.save(component);
            console.log(
              `✅ Component ${component.id} (${component.name}) status: FAULTY → PENDING_REPLACEMENT`
            );
          }
        }
      }

      // 🔥 QUAN TRỌNG: Tạo liên kết với repair requests trong bảng proposal_repair_requests
      // Đây là bảng trung gian Many-to-Many giữa replacement_proposals và repair_requests
      if (createDto.repairRequestIds && createDto.repairRequestIds.length > 0) {
        // Validate: Kiểm tra tất cả repair requests có tồn tại không
        const repairRequests = await queryRunner.manager.find(RepairRequest, {
          where: { id: In(createDto.repairRequestIds) },
        });

        if (repairRequests.length !== createDto.repairRequestIds.length) {
          throw new BadRequestException(
            `Một số repair request IDs không tồn tại. Tìm thấy ${repairRequests.length}/${createDto.repairRequestIds.length}`
          );
        }

        // Tạo liên kết Many-to-Many bằng cách gán relation
        savedProposal.repairRequests = repairRequests;
        await queryRunner.manager.save(savedProposal);

        console.log(
          `✅ Đã tạo liên kết với ${repairRequests.length} repair requests cho proposal ${savedProposal.proposalCode}`
        );
      }

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
      .leftJoinAndSelect("computer.asset", "computerAsset")
      .leftJoinAndSelect(
        "items.newlyPurchasedComponent",
        "newlyPurchasedComponent"
      )
      .leftJoinAndSelect("proposal.repairRequests", "repairRequests");

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
        "facultyAdminApprover",
        "principalApprover",
        "items",
        "items.oldComponent",
        "items.oldComponent.computer",
        "items.oldComponent.computer.asset",
        "items.oldComponent.computer.room",
        "items.oldComponent.repairRequests",
        "items.newlyPurchasedComponent",
        "repairRequests",
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
  /**
   * Cập nhật trạng thái đề xuất thay thế
   * ⚠️ Quan trọng: Khi status = ĐÃ_DUYỆT, tất cả repair requests liên quan sẽ được cập nhật thành CHỜ_THAY_THẾ
   */
  async updateStatus(
    id: string,
    updateDto: UpdateReplacementProposalStatusDto,
    currentUser: User
  ): Promise<ReplacementProposalResponseDto> {
    const proposal = await this.replacementProposalRepository.findOne({
      where: { id },
      relations: [
        "proposer",
        "teamLeadApprover",
        "adminVerifier",
        "facultyAdminApprover",
        "principalApprover",
        "items",
        "items.oldComponent",
        "items.oldComponent.computer",
        "items.oldComponent.computer.asset",
        "items.oldComponent.computer.room",
        "items.oldComponent.repairRequests",
        "repairRequests",
      ],
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

    // Auto-set faculty admin approver when status = KHOA_ĐÃ_DUYỆT_TỜ_TRÌNH (Quản trị viên khoa duyệt tờ trình)
    if (updateDto.status === ReplacementStatus.KHOA_ĐÃ_DUYỆT_TỜ_TRÌNH) {
      proposal.facultyAdminApproverId =
        updateDto.facultyAdminApproverId || currentUser.id;
    }

    // Auto-set principal approver when status = ĐÃ_DUYỆT_TỜ_TRÌNH (Ban giám hiệu duyệt tờ trình)
    if (updateDto.status === ReplacementStatus.ĐÃ_DUYỆT_TỜ_TRÌNH) {
      proposal.principalApproverId =
        updateDto.principalApproverId || currentUser.id;
    }

    // Auto-set admin verifier when status = ĐÃ_XÁC_MINH (Phòng quản trị xác nhận)
    if (updateDto.status === ReplacementStatus.ĐÃ_XÁC_MINH) {
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

    // 🔥 MỚI: Khi proposal được duyệt (ĐÃ_DUYỆT) → Cập nhật tất cả repair requests liên quan thành CHỜ_THAY_THẾ
    if (updateDto.status === ReplacementStatus.ĐÃ_DUYỆT) {
      await this.updateRelatedRepairRequests(proposal);
    }

    return this.findOne(id);
  }

  /**
   * Cập nhật tất cả repair requests liên quan khi proposal được duyệt
   * @param proposal - Replacement proposal vừa được duyệt (đã load repairRequests và items.oldComponent.repairRequests)
   */
  private async updateRelatedRepairRequests(
    proposal: ReplacementProposal
  ): Promise<void> {
    const repairRequestIds = new Set<string>();

    // 🔥 CÁCH 1: Lấy từ relation trực tiếp (từ bảng proposal_repair_requests)
    // Đây là cách CHÍNH XÁC nhất vì dựa vào bảng liên kết Many-to-Many
    if (proposal.repairRequests && proposal.repairRequests.length > 0) {
      proposal.repairRequests.forEach((rr) => {
        // Chỉ cập nhật các repair request đang ĐANG_XỬ_LÝ
        if (rr.status === RepairStatus.ĐANG_XỬ_LÝ) {
          repairRequestIds.add(rr.id);
        }
      });
    }

    // 🔥 CÁCH 2: Lấy từ các components (backup, nếu không có relation trực tiếp)
    // Cách này tìm tất cả repair requests liên quan đến các component trong proposal
    if (repairRequestIds.size === 0) {
      for (const item of proposal.items) {
        if (item.oldComponent?.repairRequests) {
          item.oldComponent.repairRequests.forEach((rr) => {
            if (rr.status === RepairStatus.ĐANG_XỬ_LÝ) {
              repairRequestIds.add(rr.id);
            }
          });
        }
      }
    }

    if (repairRequestIds.size === 0) {
      console.warn(
        `⚠️ Proposal ${proposal.proposalCode} không có repair requests đang ĐANG_XỬ_LÝ liên quan`
      );
      return;
    }

    const repairRequestIdsArray = Array.from(repairRequestIds);

    // Cập nhật tất cả repair requests thành CHỜ_THAY_THẾ
    await this.repairRequestRepository.update(
      { id: In(repairRequestIdsArray) },
      { status: RepairStatus.CHỜ_THAY_THẾ }
    );

    console.log(
      `✅ Đã cập nhật ${repairRequestIdsArray.length} repair requests sang status CHỜ_THAY_THẾ cho proposal ${proposal.proposalCode}`
    );
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
        "repairRequests",
      ],
      order: { createdAt: "DESC" },
    });

    return proposals.map((proposal) => this.mapToResponseDto(proposal));
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
        ReplacementStatus.KHOA_ĐÃ_DUYỆT_TỜ_TRÌNH,
        ReplacementStatus.ĐÃ_TỪ_CHỐI_TỜ_TRÌNH,
      ],
      [ReplacementStatus.KHOA_ĐÃ_DUYỆT_TỜ_TRÌNH]: [
        ReplacementStatus.ĐÃ_DUYỆT_TỜ_TRÌNH,
        ReplacementStatus.CHỜ_XÁC_MINH, // Cho phép Phòng QT nhận xác minh trực tiếp
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
      facultyAdminApproverId: proposal.facultyAdminApproverId,
      facultyAdminApprover: proposal.facultyAdminApprover
        ? {
            id: proposal.facultyAdminApprover.id,
            username: proposal.facultyAdminApprover.username,
            fullName: proposal.facultyAdminApprover.fullName,
            email: proposal.facultyAdminApprover.email,
          }
        : undefined,
      principalApproverId: proposal.principalApproverId,
      principalApprover: proposal.principalApprover
        ? {
            id: proposal.principalApprover.id,
            username: proposal.principalApprover.username,
            fullName: proposal.principalApprover.fullName,
            email: proposal.principalApprover.email,
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
        const computerName = item.oldComponent?.computer?.asset?.name;

        // Lấy repair request đầu tiên liên quan đến linh kiện cũ
        let repairRequestId: string | undefined;
        let requestCode: string | undefined;

        if (item.oldComponent?.repairRequests && item.oldComponent.repairRequests.length > 0) {
          // Lấy repair request đầu tiên
          const firstRepairRequest = item.oldComponent.repairRequests[0];
          repairRequestId = firstRepairRequest.id;
          requestCode = firstRepairRequest.requestCode;
        }

        return {
          id: item.id,
          proposalId: item.proposalId,
          repairRequestId,
          requestCode,
          oldComponentId: item.oldComponentId,
          oldComponent: item.oldComponent
            ? {
                id: item.oldComponent.id,
                componentType: item.oldComponent.componentType,
                name: item.oldComponent.name,
                componentSpecs: item.oldComponent.componentSpecs,
                status: item.oldComponent.status,
                roomLocation,
                computerName,
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
      repairRequests: proposal.repairRequests?.map((rr) => ({
        id: rr.id,
        requestCode: rr.requestCode,
        description: rr.description,
        status: rr.status,
        createdAt: rr.createdAt,
      })),
      repairRequestsCount: proposal.repairRequests?.length || 0,
    };
  }

  /**
   * Xóa đề xuất thay thế
   * @param id - ID của đề xuất thay thế cần xóa
   * @param currentUser - Người dùng hiện tại
   * @returns Thông báo xóa thành công
   * @throws NotFoundException nếu không tìm thấy đề xuất
   * @throws ForbiddenException nếu người dùng không có quyền xóa
   * @throws BadRequestException nếu đề xuất đang ở trạng thái không cho phép xóa
   */
  async remove(id: string, currentUser: User): Promise<{ message: string }> {
    // 1. Kiểm tra đề xuất có tồn tại không
    const proposal = await this.replacementProposalRepository.findOne({
      where: { id },
      relations: ["items", "items.oldComponent", "repairRequests"],
    });

    if (!proposal) {
      throw new NotFoundException(
        `Không tìm thấy đề xuất thay thế với ID: ${id}`
      );
    }

    // 2. Kiểm tra quyền xóa
    // Chỉ cho phép:
    // - Người đề xuất (proposer) xóa đề xuất của mình khi status là CHỜ_TỔ_TRƯỞNG_DUYỆT hoặc ĐÃ_TỪ_CHỐI
    // - Admin/Tổ trưởng có thể xóa bất kỳ đề xuất nào (trừ khi đã hoàn tất mua sắm)
    const userRoles = currentUser.roles?.map((r) => r.code) || [];
    const isAdmin = userRoles.some(
      (role) => role === "ADMIN" || role === "LEAD_TECHNICIAN"
    );
    const isProposer = proposal.proposerId === currentUser.id;
    const canDeleteByStatus =
      proposal.status === ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT ||
      proposal.status === ReplacementStatus.ĐÃ_TỪ_CHỐI;

    // Không cho phép xóa nếu đã hoàn tất mua sắm
    if (proposal.status === ReplacementStatus.ĐÃ_HOÀN_TẤT_MUA_SẮM) {
      throw new BadRequestException(
        "Không thể xóa đề xuất đã hoàn tất mua sắm. Vui lòng liên hệ quản trị viên nếu cần điều chỉnh."
      );
    }

    if (!isAdmin && (!isProposer || !canDeleteByStatus)) {
      throw new ForbiddenException(
        "Bạn không có quyền xóa đề xuất này. Chỉ có thể xóa đề xuất ở trạng thái CHỜ_TỔ_TRƯỞNG_DUYỆT hoặc ĐÃ_TỪ_CHỐI, hoặc bạn phải là Admin/Tổ trưởng."
      );
    }

    // 3. Sử dụng transaction để đảm bảo tính nhất quán
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 3.1. Rollback component status từ PENDING_REPLACEMENT về FAULTY
      // (nếu proposal chưa được duyệt hoặc đã bị từ chối)
      const shouldRollbackComponentStatus =
        proposal.status === ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT ||
        proposal.status === ReplacementStatus.ĐÃ_TỪ_CHỐI;

      if (shouldRollbackComponentStatus && proposal.items) {
        for (const item of proposal.items) {
          if (item.oldComponentId && item.oldComponent) {
            const component = await queryRunner.manager.findOne(
              ComputerComponent,
              {
                where: { id: item.oldComponentId },
              }
            );

            if (
              component &&
              component.status === ComponentStatus.PENDING_REPLACEMENT
            ) {
              // Rollback về FAULTY vì proposal bị xóa
              component.status = ComponentStatus.FAULTY;
              await queryRunner.manager.save(component);
              console.log(
                `✅ Component ${component.id} (${component.name}) status: PENDING_REPLACEMENT → FAULTY (do xóa proposal)`
              );
            }
          }
        }
      }

      // 3.2. Xóa tất cả replacement items (do có NO ACTION constraint)
      await queryRunner.manager.delete(ReplacementItem, {
        proposalId: id,
      });

      // 3.3. Xóa proposal (proposal_repair_requests sẽ tự động xóa do CASCADE)
      await queryRunner.manager.delete(ReplacementProposal, { id });

      // 3.4. Commit transaction
      await queryRunner.commitTransaction();

      return {
        message: `Xóa đề xuất thay thế ${proposal.proposalCode} thành công`,
      };
    } catch (error) {
      // Rollback nếu có lỗi
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Giải phóng query runner
      await queryRunner.release();
    }
  }
}
