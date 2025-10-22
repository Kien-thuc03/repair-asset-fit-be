import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, In } from "typeorm";
import { plainToInstance } from "class-transformer";
import { RepairRequest } from "src/entities/repair-request.entity";
import { Asset } from "src/entities/asset.entity";
import { User } from "src/entities/user.entity";
import { ComputerComponent } from "src/entities/computer-component.entity";
import { CreateRepairRequestDto } from "./dto/create-repair-request.dto";
import { UpdateRepairRequestDto } from "./dto/update-repair-request.dto";
import { RepairRequestFilterDto } from "./dto/repair-request-filter.dto";
import { AssignTechnicianDto } from "./dto/assign-technician.dto";
import { RepairRequestResponseDto } from "./dto/repair-request-response.dto";
import { RepairStatus } from "src/common/shared/RepairStatus";
import { AssetStatus } from "src/common/shared/AssetStatus";
import { ErrorType } from "src/common/shared/ErrorType";

@Injectable()
export class RepairsService {
  constructor(
    @InjectRepository(RepairRequest)
    private readonly repairRequestRepository: Repository<RepairRequest>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ComputerComponent)
    private readonly computerComponentRepository: Repository<ComputerComponent>
  ) {}

  /**
   * Tạo yêu cầu sửa chữa mới
   * @param createDto - Dữ liệu tạo yêu cầu sửa chữa
   * @param currentUser - Người dùng hiện tại (người báo lỗi)
   * @returns RepairRequestResponseDto
   */
  async create(
    createDto: CreateRepairRequestDto,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    // 1. Kiểm tra tài sản có tồn tại không
    const asset = await this.assetRepository.findOne({
      where: { id: createDto.computerAssetId },
      relations: ["currentRoom", "currentRoom.unit"],
    });

    if (!asset) {
      throw new NotFoundException(
        `Không tìm thấy tài sản với ID: ${createDto.computerAssetId}`
      );
    }

    // 2. Kiểm tra tài sản đã bị xóa chưa
    if (asset.deletedAt) {
      throw new BadRequestException(
        "Tài sản này đã bị xóa, không thể tạo yêu cầu sửa chữa"
      );
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
        `Tài sản này đang có yêu cầu sửa chữa đang xử lý (${existingRepair.requestCode})`
      );
    }

    // 4. Validate ErrorType nếu có (enum validation)
    if (
      createDto.errorType &&
      !Object.values(ErrorType).includes(createDto.errorType)
    ) {
      throw new BadRequestException(
        `Loại lỗi không hợp lệ. Các giá trị cho phép: ${Object.values(ErrorType).join(", ")}`
      );
    }

    // 5. Kiểm tra các component IDs nếu có
    let components: ComputerComponent[] = [];
    if (createDto.componentIds && createDto.componentIds.length > 0) {
      components = await this.computerComponentRepository.find({
        where: { id: In(createDto.componentIds) },
      });

      if (components.length !== createDto.componentIds.length) {
        const foundIds = components.map((c) => c.id);
        const notFoundIds = createDto.componentIds.filter(
          (id) => !foundIds.includes(id)
        );
        throw new BadRequestException(
          `Không tìm thấy các component với ID: ${notFoundIds.join(", ")}`
        );
      }
    }

    // 6. Sinh mã yêu cầu tự động (YCSC-YYYY-NNNN)
    const requestCode = await this.generateRequestCode();

    // 7. Tạo repair request mới (loại bỏ componentIds khỏi createDto)
    const { componentIds, ...requestData } = createDto;
    const repairRequest = this.repairRequestRepository.create({
      ...requestData,
      requestCode,
      reporterId: currentUser.id,
      status: RepairStatus.CHỜ_TIẾP_NHẬN,
      createdAt: new Date(),
    });

    // 8. Lưu vào database
    const savedRequest = await this.repairRequestRepository.save(repairRequest);

    // 9. Liên kết với components nếu có
    if (components.length > 0) {
      savedRequest.components = components;
      await this.repairRequestRepository.save(savedRequest);
    }

    // 10. Cập nhật trạng thái tài sản nếu cần
    if (asset.status === AssetStatus.IN_USE) {
      asset.status = AssetStatus.DAMAGED;
      await this.assetRepository.save(asset);
    }

    // 11. Lấy thông tin đầy đủ với relations
    const fullRequest = await this.repairRequestRepository.findOne({
      where: { id: savedRequest.id },
      relations: [
        "computerAsset",
        "computerAsset.currentRoom",
        "reporter",
        "assignedTechnician",
        "components",
      ],
    });

    // 12. Transform và trả về DTO
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
      .createQueryBuilder("request")
      .where("request.requestCode LIKE :prefix", { prefix: `${prefix}%` })
      .orderBy("request.requestCode", "DESC")
      .getOne();

    let nextNumber = 1;
    if (lastRequest) {
      // Lấy số thứ tự từ mã cuối cùng
      const lastNumber = parseInt(lastRequest.requestCode.split("-")[2], 10);
      nextNumber = lastNumber + 1;
    }

    // Format số thành 4 chữ số (0001, 0002, ...)
    const formattedNumber = nextNumber.toString().padStart(4, "0");
    return `${prefix}${formattedNumber}`;
  }

  /**
   * Transform entity sang DTO response
   * @param request - RepairRequest entity
   * @returns RepairRequestResponseDto
   */
  private transformToResponseDto(
    request: RepairRequest
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

    if (request.components && request.components.length > 0) {
      dto.components = request.components.map((component) => ({
        id: component.id,
        name: component.name,
        type: component.componentType,
        specifications: component.componentSpecs || "",
        status: component.status,
      })) as any;
    }

    return dto;
  }

  /**
   * Lấy danh sách yêu cầu sửa chữa với lọc và phân trang
   * @param filter - Bộ lọc và phân trang
   * @returns Danh sách yêu cầu đã phân trang
   */
  async findAll(filter: RepairRequestFilterDto) {
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
   * Lấy thông tin chi tiết một yêu cầu sửa chữa
   * @param id - ID yêu cầu sửa chữa
   * @returns RepairRequestResponseDto
   */
  async findOne(id: string): Promise<RepairRequestResponseDto> {
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
      relations: [
        "computerAsset",
        "computerAsset.currentRoom",
        "reporter",
        "assignedTechnician",
        "components",
      ],
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    return this.transformToResponseDto(repairRequest);
  }

  /**
   * Cập nhật thông tin yêu cầu sửa chữa
   * @param id - ID yêu cầu sửa chữa
   * @param updateDto - Dữ liệu cập nhật
   * @param currentUser - Người dùng hiện tại
   * @returns RepairRequestResponseDto
   */
  async update(
    id: string,
    updateDto: UpdateRepairRequestDto,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
      relations: ["reporter", "assignedTechnician"],
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    // Kiểm tra quyền cập nhật
    const canUpdate = this.canUserUpdateRequest(repairRequest, currentUser);
    if (!canUpdate) {
      throw new ForbiddenException("Bạn không có quyền cập nhật yêu cầu này");
    }

    // Validate status transition nếu có
    if (updateDto.status && updateDto.status !== repairRequest.status) {
      this.validateStatusTransition(repairRequest.status, updateDto.status);
    }

    // Cập nhật thông tin
    Object.assign(repairRequest, updateDto);

    // Cập nhật timestamp tương ứng với status
    if (updateDto.status) {
      this.updateTimestampForStatus(repairRequest, updateDto.status);
    }

    const updatedRequest =
      await this.repairRequestRepository.save(repairRequest);

    // Lấy thông tin đầy đủ với relations
    const fullRequest = await this.repairRequestRepository.findOne({
      where: { id },
      relations: [
        "computerAsset",
        "computerAsset.currentRoom",
        "reporter",
        "assignedTechnician",
        "components",
      ],
    });

    return this.transformToResponseDto(fullRequest);
  }

  /**
   * Tiếp nhận yêu cầu sửa chữa
   * @param id - ID yêu cầu sửa chữa
   * @param currentUser - Người tiếp nhận
   * @returns RepairRequestResponseDto
   */
  async acceptRequest(
    id: string,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    if (repairRequest.status !== RepairStatus.CHỜ_TIẾP_NHẬN) {
      throw new BadRequestException(
        "Chỉ có thể tiếp nhận yêu cầu ở trạng thái CHỜ_TIẾP_NHẬN"
      );
    }

    // Kiểm tra quyền tiếp nhận (kỹ thuật viên hoặc admin)
    if (!this.canUserAcceptRequest(currentUser)) {
      throw new ForbiddenException(
        "Bạn không có quyền tiếp nhận yêu cầu sửa chữa"
      );
    }

    repairRequest.status = RepairStatus.ĐÃ_TIẾP_NHẬN;
    repairRequest.acceptedAt = new Date();

    await this.repairRequestRepository.save(repairRequest);

    return this.findOne(id);
  }

  /**
   * Phân công kỹ thuật viên
   * @param id - ID yêu cầu sửa chữa
   * @param assignDto - Thông tin phân công
   * @param currentUser - Người phân công
   * @returns RepairRequestResponseDto
   */
  async assignTechnician(
    id: string,
    assignDto: AssignTechnicianDto,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    if (repairRequest.status !== RepairStatus.ĐÃ_TIẾP_NHẬN) {
      throw new BadRequestException(
        "Chỉ có thể phân công kỹ thuật viên khi yêu cầu đã được tiếp nhận"
      );
    }

    // Kiểm tra quyền phân công (admin hoặc trưởng nhóm)
    if (!this.canUserAssignTechnician(currentUser)) {
      throw new ForbiddenException(
        "Bạn không có quyền phân công kỹ thuật viên"
      );
    }

    // Kiểm tra kỹ thuật viên có tồn tại không
    const technician = await this.userRepository.findOne({
      where: { id: assignDto.technicianId },
    });

    if (!technician) {
      throw new NotFoundException(
        `Không tìm thấy kỹ thuật viên với ID: ${assignDto.technicianId}`
      );
    }

    // Kiểm tra kỹ thuật viên có role phù hợp không
    if (!this.isUserTechnician(technician)) {
      throw new BadRequestException(
        "Người dùng được chọn không phải là kỹ thuật viên"
      );
    }

    repairRequest.assignedTechnicianId = assignDto.technicianId;
    if (assignDto.assignmentNotes) {
      repairRequest.resolutionNotes = assignDto.assignmentNotes;
    }

    await this.repairRequestRepository.save(repairRequest);

    return this.findOne(id);
  }

  /**
   * Bắt đầu xử lý sửa chữa
   * @param id - ID yêu cầu sửa chữa
   * @param currentUser - Kỹ thuật viên
   * @returns RepairRequestResponseDto
   */
  async startProcessing(
    id: string,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    if (repairRequest.status !== RepairStatus.ĐÃ_TIẾP_NHẬN) {
      throw new BadRequestException(
        "Chỉ có thể bắt đầu xử lý yêu cầu đã được tiếp nhận"
      );
    }

    // Kiểm tra có phải kỹ thuật viên được phân công không
    if (
      repairRequest.assignedTechnicianId !== currentUser.id &&
      !this.isAdmin(currentUser)
    ) {
      throw new ForbiddenException(
        "Chỉ kỹ thuật viên được phân công mới có thể bắt đầu xử lý"
      );
    }

    repairRequest.status = RepairStatus.ĐANG_XỬ_LÝ;
    await this.repairRequestRepository.save(repairRequest);

    return this.findOne(id);
  }

  /**
   * Hoàn thành yêu cầu sửa chữa
   * @param id - ID yêu cầu sửa chữa
   * @param resolutionNotes - Ghi chú kết quả
   * @param currentUser - Người hoàn thành
   * @returns RepairRequestResponseDto
   */
  async completeRequest(
    id: string,
    resolutionNotes: string,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
      relations: ["computerAsset"],
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    if (
      ![RepairStatus.ĐANG_XỬ_LÝ, RepairStatus.CHỜ_THAY_THẾ].includes(
        repairRequest.status
      )
    ) {
      throw new BadRequestException(
        "Chỉ có thể hoàn thành yêu cầu đang được xử lý hoặc chờ thay thế"
      );
    }

    // Kiểm tra quyền hoàn thành
    if (
      repairRequest.assignedTechnicianId !== currentUser.id &&
      !this.isAdmin(currentUser)
    ) {
      throw new ForbiddenException(
        "Chỉ kỹ thuật viên được phân công hoặc admin mới có thể hoàn thành"
      );
    }

    repairRequest.status = RepairStatus.ĐÃ_HOÀN_THÀNH;
    repairRequest.resolutionNotes = resolutionNotes;
    repairRequest.completedAt = new Date();

    // Cập nhật trạng thái tài sản về bình thường
    if (repairRequest.computerAsset) {
      repairRequest.computerAsset.status = AssetStatus.IN_USE;
      await this.assetRepository.save(repairRequest.computerAsset);
    }

    await this.repairRequestRepository.save(repairRequest);

    return this.findOne(id);
  }

  /**
   * Hủy yêu cầu sửa chữa
   * @param id - ID yêu cầu sửa chữa
   * @param cancelReason - Lý do hủy
   * @param currentUser - Người hủy
   * @returns RepairRequestResponseDto
   */
  async cancelRequest(
    id: string,
    cancelReason: string,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
      relations: ["reporter", "computerAsset"],
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    if (repairRequest.status === RepairStatus.ĐÃ_HOÀN_THÀNH) {
      throw new BadRequestException("Không thể hủy yêu cầu đã hoàn thành");
    }

    // Kiểm tra quyền hủy
    const canCancel =
      (repairRequest.reporterId === currentUser.id &&
        repairRequest.status === RepairStatus.CHỜ_TIẾP_NHẬN) ||
      this.isAdmin(currentUser);

    if (!canCancel) {
      throw new ForbiddenException("Bạn không có quyền hủy yêu cầu này");
    }

    repairRequest.status = RepairStatus.ĐÃ_HỦY;
    repairRequest.resolutionNotes = `ĐÃ HỦY: ${cancelReason}`;

    // Khôi phục trạng thái tài sản nếu cần
    if (
      repairRequest.computerAsset &&
      repairRequest.computerAsset.status === AssetStatus.DAMAGED
    ) {
      repairRequest.computerAsset.status = AssetStatus.IN_USE;
      await this.assetRepository.save(repairRequest.computerAsset);
    }

    await this.repairRequestRepository.save(repairRequest);

    return this.findOne(id);
  }

  /**
   * Tạo query builder với các điều kiện lọc
   * @param filter - Bộ lọc
   * @returns SelectQueryBuilder<RepairRequest>
   */
  private createQueryBuilder(
    filter: RepairRequestFilterDto
  ): SelectQueryBuilder<RepairRequest> {
    const queryBuilder = this.repairRequestRepository
      .createQueryBuilder("request")
      .leftJoinAndSelect("request.computerAsset", "asset")
      .leftJoinAndSelect("request.reporter", "reporter")
      .leftJoinAndSelect("request.assignedTechnician", "technician")
      .leftJoinAndSelect("asset.currentRoom", "room")
      .leftJoinAndSelect("request.components", "components");

    // Lọc theo computerAssetId
    if (filter.computerAssetId) {
      queryBuilder.andWhere("request.computerAssetId = :computerAssetId", {
        computerAssetId: filter.computerAssetId,
      });
    }

    // Lọc theo reporterId
    if (filter.reporterId) {
      queryBuilder.andWhere("request.reporterId = :reporterId", {
        reporterId: filter.reporterId,
      });
    }

    // Lọc theo assignedTechnicianId
    if (filter.assignedTechnicianId) {
      queryBuilder.andWhere(
        "request.assignedTechnicianId = :assignedTechnicianId",
        {
          assignedTechnicianId: filter.assignedTechnicianId,
        }
      );
    }

    // Lọc theo status
    if (filter.status) {
      queryBuilder.andWhere("request.status = :status", {
        status: filter.status,
      });
    }

    // Lọc theo errorType
    if (filter.errorType) {
      queryBuilder.andWhere("request.errorType = :errorType", {
        errorType: filter.errorType,
      });
    }

    // Tìm kiếm theo requestCode hoặc description
    if (filter.search) {
      queryBuilder.andWhere(
        "(request.requestCode ILIKE :search OR request.description ILIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    // Lọc theo khoảng thời gian
    if (filter.fromDate) {
      queryBuilder.andWhere("request.createdAt >= :fromDate", {
        fromDate: new Date(filter.fromDate),
      });
    }

    if (filter.toDate) {
      queryBuilder.andWhere("request.createdAt <= :toDate", {
        toDate: new Date(filter.toDate),
      });
    }

    // Sắp xếp
    const sortBy = filter.sortBy || "createdAt";
    const sortOrder = (filter.sortOrder || "DESC") as "ASC" | "DESC";

    queryBuilder.orderBy(`request.${sortBy}`, sortOrder);

    return queryBuilder;
  }

  /**
   * Kiểm tra user có thể cập nhật request không
   * @param request - RepairRequest
   * @param user - User
   * @returns boolean
   */
  private canUserUpdateRequest(request: RepairRequest, user: User): boolean {
    // Người báo lỗi có thể sửa khi CHỜ_TIẾP_NHẬN
    if (
      request.reporterId === user.id &&
      request.status === RepairStatus.CHỜ_TIẾP_NHẬN
    ) {
      return true;
    }

    // Kỹ thuật viên được phân công có thể sửa
    if (request.assignedTechnicianId === user.id) {
      return true;
    }

    // Admin có thể sửa bất kỳ lúc nào
    return this.isAdmin(user);
  }

  /**
   * Kiểm tra user có thể tiếp nhận request không
   * @param user - User
   * @returns boolean
   */
  private canUserAcceptRequest(user: User): boolean {
    return this.isUserTechnician(user) || this.isAdmin(user);
  }

  /**
   * Kiểm tra user có thể phân công kỹ thuật viên không
   * @param user - User
   * @returns boolean
   */
  private canUserAssignTechnician(user: User): boolean {
    // TODO: Implement role check for team lead or admin
    return this.isAdmin(user);
  }

  /**
   * Validate chuyển đổi trạng thái
   * @param fromStatus - Trạng thái hiện tại
   * @param toStatus - Trạng thái mới
   */
  private validateStatusTransition(
    fromStatus: RepairStatus,
    toStatus: RepairStatus
  ): void {
    const validTransitions: Record<RepairStatus, RepairStatus[]> = {
      [RepairStatus.CHỜ_TIẾP_NHẬN]: [
        RepairStatus.ĐÃ_TIẾP_NHẬN,
        RepairStatus.ĐÃ_HỦY,
      ],
      [RepairStatus.ĐÃ_TIẾP_NHẬN]: [
        RepairStatus.ĐANG_XỬ_LÝ,
        RepairStatus.ĐÃ_HỦY,
      ],
      [RepairStatus.ĐANG_XỬ_LÝ]: [
        RepairStatus.CHỜ_THAY_THẾ,
        RepairStatus.ĐÃ_HOÀN_THÀNH,
        RepairStatus.ĐÃ_HỦY,
      ],
      [RepairStatus.CHỜ_THAY_THẾ]: [
        RepairStatus.ĐANG_XỬ_LÝ,
        RepairStatus.ĐÃ_HOÀN_THÀNH,
      ],
      [RepairStatus.ĐÃ_HOÀN_THÀNH]: [], // Không thể chuyển từ hoàn thành
      [RepairStatus.ĐÃ_HỦY]: [], // Không thể chuyển từ hủy
    };

    if (!validTransitions[fromStatus]?.includes(toStatus)) {
      throw new BadRequestException(
        `Không thể chuyển từ trạng thái ${fromStatus} sang ${toStatus}`
      );
    }
  }

  /**
   * Cập nhật timestamp tương ứng với status
   * @param request - RepairRequest
   * @param status - Trạng thái mới
   */
  private updateTimestampForStatus(
    request: RepairRequest,
    status: RepairStatus
  ): void {
    switch (status) {
      case RepairStatus.ĐÃ_TIẾP_NHẬN:
        request.acceptedAt = new Date();
        break;
      case RepairStatus.ĐÃ_HOÀN_THÀNH:
        request.completedAt = new Date();
        break;
    }
  }

  /**
   * Kiểm tra user có phải admin không
   * @param user - User cần kiểm tra
   * @returns boolean
   */
  private isAdmin(user: User): boolean {
    // TODO: Implement admin role check
    return user.roles?.some((role) => role.name === "ADMIN") || false;
  }

  /**
   * Kiểm tra user có phải kỹ thuật viên không
   * @param user - User cần kiểm tra
   * @returns boolean
   */
  private isUserTechnician(user: User): boolean {
    // TODO: Implement technician role check
    return (
      user.roles?.some((role) =>
        ["TECHNICIAN", "LEAD_TECHNICIAN"].includes(role.name)
      ) || false
    );
  }
}
