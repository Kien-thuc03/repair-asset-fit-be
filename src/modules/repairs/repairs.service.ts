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
import { Computer } from "src/entities/computer.entity";
import { AssetSoftware } from "src/entities/asset-software.entity";
import { Software } from "src/entities/software.entity";
import { TechnicianAssignment } from "src/entities/technician-assignment.entity";
import { Room } from "src/entities/room.entity";
import { CreateRepairRequestDto } from "./dto/create-repair-request.dto";
import { UpdateRepairRequestDto } from "./dto/update-repair-request.dto";
import { RepairRequestFilterDto } from "./dto/repair-request-filter.dto";
import { StartProcessingDto } from "./dto/start-processing.dto";
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
    private readonly computerComponentRepository: Repository<ComputerComponent>,
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>,
    @InjectRepository(AssetSoftware)
    private readonly assetSoftwareRepository: Repository<AssetSoftware>,
    @InjectRepository(Software)
    private readonly softwareRepository: Repository<Software>,
    @InjectRepository(TechnicianAssignment)
    private readonly technicianAssignmentRepository: Repository<TechnicianAssignment>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>
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

    // 5.1. Kiểm tra các software IDs nếu có (chỉ khi errorType là MAY_HU_PHAN_MEM)
    if (createDto.softwareIds && createDto.softwareIds.length > 0) {
      // Kiểm tra errorType phải là MAY_HU_PHAN_MEM
      if (createDto.errorType !== ErrorType.MAY_HU_PHAN_MEM) {
        throw new BadRequestException(
          "Software IDs chỉ có thể sử dụng khi errorType là MAY_HU_PHAN_MEM"
        );
      }

      // Kiểm tra software có tồn tại và được cài đặt trong asset này không
      const assetSoftwareList = await this.assetSoftwareRepository
        .createQueryBuilder("asw")
        .leftJoinAndSelect("asw.software", "s")
        .where("asw.assetId = :assetId", { assetId: createDto.computerAssetId })
        .andWhere("s.id IN (:...softwareIds)", {
          softwareIds: createDto.softwareIds,
        })
        .andWhere("s.deletedAt IS NULL")
        .getMany();

      if (assetSoftwareList.length !== createDto.softwareIds.length) {
        const foundSoftwareIds = assetSoftwareList.map((asw) => asw.softwareId);
        const notFoundIds = createDto.softwareIds.filter(
          (id) => !foundSoftwareIds.includes(id)
        );
        throw new BadRequestException(
          `Không tìm thấy hoặc chưa cài đặt các software với ID: ${notFoundIds.join(", ")} trong computer này`
        );
      }

      // Thêm thông tin software vào description để theo dõi
      const softwareNames = assetSoftwareList.map((asw) =>
        `${asw.software.name} ${asw.software.version ? "v" + asw.software.version : ""}`.trim()
      );
      createDto.description += `\n\n[Phần mềm gặp sự cố: ${softwareNames.join(", ")}]`;
    }

    // 6. Sinh mã yêu cầu tự động (YCSC-YYYY-NNNN)
    const requestCode = await this.generateRequestCode();

    // 7. Tạo repair request mới (loại bỏ componentIds và softwareIds khỏi createDto)
    const { componentIds, softwareIds, ...requestData } = createDto;
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

    // 11. Tự động phân công kỹ thuật viên dựa trên vị trí asset
    if (asset.currentRoom) {
      const assignedTechnician = await this.autoAssignTechnician(
        asset.currentRoom.id,
        asset.currentRoom.building,
        asset.currentRoom.floor
      );

      if (assignedTechnician) {
        savedRequest.assignedTechnicianId = assignedTechnician.id;
        await this.repairRequestRepository.save(savedRequest);
      }
    }

    // 12. Lấy thông tin đầy đủ với relations
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

    // 13. Transform và trả về DTO
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
      relations: [
        "reporter",
        "assignedTechnician",
        "computerAsset",
        "computerAsset.currentRoom",
      ],
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    // Kiểm tra quyền cập nhật
    const canUpdate = await this.canUserUpdateRequest(
      repairRequest,
      currentUser
    );
    if (!canUpdate) {
      throw new ForbiddenException("Bạn không có quyền cập nhật yêu cầu này");
    }

    // Tự động gán kỹ thuật viên khi chuyển sang ĐÃ_TIẾP_NHẬN
    if (
      updateDto.status === RepairStatus.ĐÃ_TIẾP_NHẬN &&
      !repairRequest.assignedTechnicianId &&
      this.isUserTechnician(currentUser)
    ) {
      repairRequest.assignedTechnicianId = currentUser.id;
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
   * Lấy danh sách tầng được phân công cho kỹ thuật viên
   * @param user - Kỹ thuật viên hiện tại
   * @returns Danh sách tầng và thống kê yêu cầu
   */
  async getAssignedFloors(user: User) {
    // Kiểm tra quyền - chỉ kỹ thuật viên mới cần kiểm tra assigned floors
    const isTechnician = this.isUserTechnician(user);
    const isAdmin = this.isAdmin(user);

    if (!isTechnician && !isAdmin) {
      throw new ForbiddenException(
        "Bạn không có quyền xem danh sách tầng được phân công"
      );
    }

    // Admin hoặc tổ trưởng có thể xem tất cả
    if (isAdmin) {
      // Lấy tất cả building/floor từ rooms
      const floors = await this.roomRepository
        .createQueryBuilder("room")
        .select(["room.building", "room.floor"])
        .distinct(true)
        .orderBy("room.building", "ASC")
        .addOrderBy("room.floor", "ASC")
        .getRawMany();

      const assignedFloors = await Promise.all(
        floors.map(async (floor) => {
          const stats = await this.getFloorStatistics(
            floor.room_building,
            floor.room_floor
          );
          return {
            building: floor.room_building,
            floor: floor.room_floor,
            ...stats,
          };
        })
      );

      return {
        assignedFloors,
        totalAssignedFloors: assignedFloors.length,
        totalPendingRequests: assignedFloors.reduce(
          (sum, f) => sum + f.pendingRequests,
          0
        ),
      };
    }

    // Kỹ thuật viên thường chỉ xem tầng được phân công
    const assignments = await this.technicianAssignmentRepository.find({
      where: { technicianId: user.id },
      order: { building: "ASC", floor: "ASC" },
    });

    if (assignments.length === 0) {
      return {
        assignedFloors: [],
        totalAssignedFloors: 0,
        totalPendingRequests: 0,
      };
    }

    const assignedFloors = await Promise.all(
      assignments.map(async (assignment) => {
        const stats = await this.getFloorStatistics(
          assignment.building,
          assignment.floor
        );
        return {
          building: assignment.building,
          floor: assignment.floor,
          ...stats,
        };
      })
    );

    return {
      assignedFloors,
      totalAssignedFloors: assignedFloors.length,
      totalPendingRequests: assignedFloors.reduce(
        (sum, f) => sum + f.pendingRequests,
        0
      ),
    };
  }

  /**
   * Lấy thống kê yêu cầu theo tầng
   */
  private async getFloorStatistics(building: string, floor: string) {
    const baseQuery = this.repairRequestRepository
      .createQueryBuilder("rr")
      .innerJoin("assets", "a", "rr.computerAssetId = a.id")
      .innerJoin("rooms", "r", "a.currentRoomId = r.id")
      .where("r.building = :building", { building })
      .andWhere("r.floor = :floor", { floor });

    const [pendingRequests, inProgressRequests, waitingReplacementRequests] =
      await Promise.all([
        baseQuery
          .clone()
          .andWhere("rr.status = :status", {
            status: RepairStatus.ĐÃ_TIẾP_NHẬN,
          })
          .getCount(),
        baseQuery
          .clone()
          .andWhere("rr.status = :status", { status: RepairStatus.ĐANG_XỬ_LÝ })
          .getCount(),
        baseQuery
          .clone()
          .andWhere("rr.status = :status", {
            status: RepairStatus.CHỜ_THAY_THẾ,
          })
          .getCount(),
      ]);

    return {
      pendingRequests,
      inProgressRequests,
      waitingReplacementRequests,
    };
  }

  /**
   * Lấy danh sách yêu cầu theo tầng
   * @param filter - Filter parameters
   * @param user - User hiện tại
   * @returns Danh sách yêu cầu
   */
  async findByFloor(
    filter: RepairRequestFilterDto & { building?: string; floor?: string },
    user: User
  ) {
    const isTechnician = this.isUserTechnician(user);
    const isAdmin = this.isAdmin(user);

    if (!isTechnician && !isAdmin) {
      throw new ForbiddenException("Bạn không có quyền xem yêu cầu sửa chữa");
    }

    // Build base query
    const queryBuilder = this.repairRequestRepository
      .createQueryBuilder("rr")
      .leftJoinAndSelect("rr.computerAsset", "asset")
      .leftJoinAndSelect("asset.currentRoom", "room")
      .leftJoinAndSelect("room.unit", "unit")
      .leftJoinAndSelect("rr.reportedByUser", "reporter")
      .leftJoinAndSelect("rr.assignedTechnician", "technician");

    // Nếu là kỹ thuật viên thường, chỉ xem yêu cầu trong tầng được phân công
    if (isTechnician && !isAdmin) {
      const assignments = await this.technicianAssignmentRepository.find({
        where: { technicianId: user.id },
      });

      if (assignments.length === 0) {
        return {
          items: [],
          total: 0,
        };
      }

      // Build OR conditions for each assignment
      const conditions = assignments.map((assignment, index) => {
        const params: any = {};
        params[`building_${index}`] = assignment.building;
        params[`floor_${index}`] = assignment.floor;

        return {
          query: `(room.building = :building_${index} AND room.floor = :floor_${index})`,
          params,
        };
      });

      const whereClause = conditions.map((c) => c.query).join(" OR ");
      const allParams = conditions.reduce(
        (acc, c) => ({ ...acc, ...c.params }),
        {}
      );

      queryBuilder.andWhere(`(${whereClause})`, allParams);
    }

    // Apply additional filters
    if (filter.building) {
      queryBuilder.andWhere("room.building = :building", {
        building: filter.building,
      });
    }

    if (filter.floor) {
      queryBuilder.andWhere("room.floor = :floor", { floor: filter.floor });
    }

    if (filter.status) {
      queryBuilder.andWhere("rr.status = :status", { status: filter.status });
    }

    if (filter.errorType) {
      queryBuilder.andWhere("rr.errorType = :errorType", {
        errorType: filter.errorType,
      });
    }

    if (filter.search) {
      queryBuilder.andWhere(
        "(rr.requestCode LIKE :search OR rr.issueDescription LIKE :search)",
        { search: `%${filter.search}%` }
      );
    }

    // Sorting - ưu tiên theo ngày tạo (mới nhất trước)
    queryBuilder.orderBy("rr.createdAt", "DESC");

    // Pagination
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items: items.map((item) =>
        plainToInstance(RepairRequestResponseDto, item)
      ),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Kỹ thuật viên tự nhận và bắt đầu xử lý yêu cầu
   * @param id - ID yêu cầu sửa chữa
   * @param startDto - Thông tin bắt đầu xử lý
   * @param currentUser - Kỹ thuật viên
   * @returns RepairRequestResponseDto
   */
  async startProcessing(
    id: string,
    startDto: StartProcessingDto,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    // Tìm yêu cầu với thông tin asset và room
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
      relations: ["computerAsset", "computerAsset.currentRoom"],
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

    // Kiểm tra quyền
    const isTechnician = this.isUserTechnician(currentUser);
    const isAdmin = this.isAdmin(currentUser);

    if (!isTechnician && !isAdmin) {
      throw new ForbiddenException("Bạn không có quyền xử lý yêu cầu này");
    }

    // Nếu là kỹ thuật viên thường, kiểm tra yêu cầu có thuộc tầng được phân công không
    if (isTechnician && !isAdmin) {
      const room = repairRequest.computerAsset?.currentRoom;
      if (!room) {
        throw new BadRequestException("Không thể xác định vị trí của tài sản");
      }

      const assignments = await this.technicianAssignmentRepository.find({
        where: { technicianId: currentUser.id },
      });

      const isAssignedToFloor = assignments.some(
        (a) => a.building === room.building && a.floor === room.floor
      );

      if (!isAssignedToFloor) {
        const assignedFloors = assignments
          .map((a) => `${a.building}-${a.floor}`)
          .join(", ");
        throw new ForbiddenException(
          `Yêu cầu này không nằm trong tầng mà bạn được phân công (${assignedFloors || "Chưa có phân công"})`
        );
      }
    }

    // Kiểm tra kỹ thuật viên có đang quá tải không
    const ongoingRequestsCount = await this.repairRequestRepository.count({
      where: {
        assignedTechnicianId: currentUser.id,
        status: RepairStatus.ĐANG_XỬ_LÝ,
      },
    });

    const MAX_CONCURRENT_REQUESTS = 5;
    if (ongoingRequestsCount >= MAX_CONCURRENT_REQUESTS) {
      throw new BadRequestException(
        `Bạn đang xử lý quá nhiều yêu cầu cùng lúc (${ongoingRequestsCount}/${MAX_CONCURRENT_REQUESTS})`
      );
    }

    // Tự động gán và bắt đầu xử lý
    repairRequest.assignedTechnicianId = currentUser.id;
    repairRequest.status = RepairStatus.ĐANG_XỬ_LÝ;
    repairRequest.resolutionNotes = startDto.processingNotes;

    if (startDto.estimatedTime) {
      const estimatedCompletionTime = new Date();
      estimatedCompletionTime.setMinutes(
        estimatedCompletionTime.getMinutes() + startDto.estimatedTime
      );
      // Note: Cần thêm field estimatedCompletionTime vào entity nếu chưa có
    }

    await this.repairRequestRepository.save(repairRequest);

    return this.findOne(id);
  }

  /**
   * Bắt đầu xử lý sửa chữa (deprecated - sử dụng startProcessing thay thế)
   * @deprecated Use startProcessing instead
   */
  async startProcessingOld(
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
  private async canUserUpdateRequest(
    request: RepairRequest,
    user: User
  ): Promise<boolean> {
    // Admin có thể sửa bất kỳ lúc nào
    if (this.isAdmin(user)) {
      return true;
    }

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

    // Kỹ thuật viên có thể tự tiếp nhận yêu cầu trong tầng được phân công
    if (this.isUserTechnician(user)) {
      // Lấy thông tin phòng của tài sản
      const room = request.computerAsset?.currentRoom;
      if (!room) {
        return false; // Không có thông tin phòng
      }

      // Kiểm tra kỹ thuật viên có được phân công cho tầng này không
      const assignment = await this.technicianAssignmentRepository.findOne({
        where: {
          technicianId: user.id,
          building: room.building,
          floor: room.floor,
        },
      });

      return !!assignment; // Có assignment → có quyền
    }

    return false;
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
    return user.roles?.some((role) => role.code === "ADMIN") || false;
  }

  /**
   * Kiểm tra user có phải kỹ thuật viên không
   * @param user - User cần kiểm tra
   * @returns boolean
   */
  private isUserTechnician(user: User): boolean {
    return (
      user.roles?.some((role) =>
        ["KY_THUAT_VIEN", "TO_TRUONG_KY_THUAT"].includes(role.code)
      ) || false
    );
  }

  /**
   * Tự động phân công kỹ thuật viên phù hợp dựa trên vị trí phòng
   * - Tìm các KTV được phân công cho tầng hoặc tòa nhà
   * - Chọn KTV có ít yêu cầu đang xử lý nhất
   * @param roomId - ID phòng
   * @param building - Tên tòa nhà
   * @param floor - Tên tầng
   * @returns User (KTV được chọn) hoặc null nếu không tìm thấy
   */
  private async autoAssignTechnician(
    roomId: string,
    building: string,
    floor: string
  ): Promise<User | null> {
    try {
      // 1. Tìm các KTV được phân công cho tầng hoặc tòa nhà
      const assignments = await this.technicianAssignmentRepository
        .createQueryBuilder("assignment")
        .leftJoinAndSelect("assignment.technician", "technician")
        .leftJoinAndSelect("technician.roles", "roles")
        .where("assignment.building = :building", { building })
        .andWhere(
          "(assignment.floor = :floor OR assignment.floor IS NULL)",
          { floor }
        )
        .andWhere("technician.deletedAt IS NULL")
        .getMany();

      if (assignments.length === 0) {
        console.warn(
          `Không tìm thấy kỹ thuật viên được phân công cho tầng ${floor} tòa ${building}`
        );
        return null;
      }

      // 2. Lấy danh sách KTV
      const technicians = assignments.map((a) => a.technician);

      // 3. Đếm số lượng yêu cầu đang xử lý của từng KTV
      const technicianWorkloads = await Promise.all(
        technicians.map(async (technician) => {
          const ongoingCount = await this.repairRequestRepository.count({
            where: {
              assignedTechnicianId: technician.id,
              status: RepairStatus.ĐANG_XỬ_LÝ,
            },
          });

          const acceptedCount = await this.repairRequestRepository.count({
            where: {
              assignedTechnicianId: technician.id,
              status: RepairStatus.ĐÃ_TIẾP_NHẬN,
            },
          });

          return {
            technician,
            workload: ongoingCount + acceptedCount,
          };
        })
      );

      // 4. Sắp xếp theo workload tăng dần và chọn KTV có ít việc nhất
      technicianWorkloads.sort((a, b) => a.workload - b.workload);

      const selectedTechnician = technicianWorkloads[0].technician;

      console.log(
        `Tự động phân công KTV: ${selectedTechnician.fullName} (${selectedTechnician.username}) ` +
          `cho phòng ${roomId} - Workload hiện tại: ${technicianWorkloads[0].workload}`
      );

      return selectedTechnician;
    } catch (error) {
      console.error("Lỗi khi tự động phân công kỹ thuật viên:", error);
      return null;
    }
  }

  /**
   * Lấy danh sách kỹ thuật viên phụ trách một phòng cụ thể
   * @param roomId - ID của phòng
   * @returns Danh sách User (các KTV phụ trách)
   */
  async getTechniciansForRoom(roomId: string): Promise<User[]> {
    const room = await this.roomRepository.findOne({
      where: { id: roomId },
    });

    if (!room) {
      throw new NotFoundException(`Không tìm thấy phòng với ID: ${roomId}`);
    }

    // Tìm các KTV được phân công cho tầng cụ thể hoặc cả tòa nhà
    const assignments = await this.technicianAssignmentRepository
      .createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.technician", "technician")
      .leftJoinAndSelect("technician.roles", "roles")
      .where("assignment.building = :building", { building: room.building })
      .andWhere(
        "(assignment.floor = :floor OR assignment.floor IS NULL)",
        { floor: room.floor }
      )
      .andWhere("technician.deletedAt IS NULL")
      .getMany();

    return assignments.map((a) => a.technician);
  }
}
