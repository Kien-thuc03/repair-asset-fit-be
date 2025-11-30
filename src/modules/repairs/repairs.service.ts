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
import { RepairLog } from "src/entities/repair-log.entity";
import { Asset } from "src/entities/asset.entity";
import { User } from "src/entities/user.entity";
import { ComputerComponent } from "src/entities/computer-component.entity";
import { Computer } from "src/entities/computer.entity";
import { ComputerSoftware } from "src/entities/computer-software.entity";
import { Software } from "src/entities/software.entity";
import { TechnicianAssignment } from "src/entities/technician-assignment.entity";
import { Room } from "src/entities/room.entity";
import { CreateRepairRequestDto } from "./dto/create-repair-request.dto";
import { UpdateRepairRequestDto } from "./dto/update-repair-request.dto";
import { RepairRequestFilterDto } from "./dto/repair-request-filter.dto";
import { StartProcessingDto } from "./dto/start-processing.dto";
import { RepairRequestResponseDto } from "./dto/repair-request-response.dto";
import { CreateAndProcessRepairRequestDto } from "./dto/create-and-process-repair-request.dto";
import { RepairStatus } from "src/common/shared/RepairStatus";
import { AssetStatus } from "src/common/shared/AssetStatus";
import { ComponentStatus } from "src/common/shared/ComponentStatus";
import { ErrorType } from "src/common/shared/ErrorType";

@Injectable()
export class RepairsService {
  constructor(
    @InjectRepository(RepairRequest)
    private readonly repairRequestRepository: Repository<RepairRequest>,
    @InjectRepository(RepairLog)
    private readonly repairLogRepository: Repository<RepairLog>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ComputerComponent)
    private readonly computerComponentRepository: Repository<ComputerComponent>,
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>,
    @InjectRepository(ComputerSoftware)
    private readonly computerSoftwareRepository: Repository<ComputerSoftware>,
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

    // 3. Kiểm tra tài sản có đang được sửa chữa không (kiểm tra TẤT CẢ trạng thái chưa hoàn thành)
    const existingRepair = await this.repairRequestRepository.findOne({
      where: {
        computerAssetId: createDto.computerAssetId,
        status: In([
          RepairStatus.CHỜ_TIẾP_NHẬN,
          RepairStatus.ĐÃ_TIẾP_NHẬN,
          RepairStatus.ĐANG_XỬ_LÝ,
          RepairStatus.CHỜ_THAY_THẾ,
        ]),
      },
      order: {
        createdAt: "DESC",
      },
    });

    if (existingRepair) {
      throw new ConflictException(
        `Máy này đang có yêu cầu sửa chữa chưa hoàn thành (${existingRepair.requestCode} - ${existingRepair.status}). Vui lòng chọn máy khác hoặc đợi yêu cầu hiện tại hoàn thành.`
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

      // 5.2. Kiểm tra các component có đang trong repair request chưa hoàn thành không
      const componentsInActiveRepairs = await this.repairRequestRepository
        .createQueryBuilder("rr")
        .innerJoin(
          "repair_request_components",
          "rrc",
          "rr.id = rrc.repairRequestId"
        )
        .where("rrc.componentId IN (:...componentIds)", {
          componentIds: createDto.componentIds,
        })
        .andWhere("rr.status NOT IN (:...completedStatuses)", {
          completedStatuses: [RepairStatus.ĐÃ_HOÀN_THÀNH, RepairStatus.ĐÃ_HỦY],
        })
        .select([
          "rr.id",
          "rr.requestCode",
          "rr.status",
          "rrc.componentId as componentId",
        ])
        .getRawMany();

      if (componentsInActiveRepairs.length > 0) {
        // Group components by repair request để hiển thị thông tin rõ ràng
        const requestMap = new Map<
          string,
          { code: string; status: string; components: string[] }
        >();

        for (const item of componentsInActiveRepairs) {
          const key = item.rr_id;
          if (!requestMap.has(key)) {
            requestMap.set(key, {
              code: item.rr_requestCode,
              status: item.rr_status,
              components: [],
            });
          }

          const component = components.find((c) => c.id === item.componentId);
          if (component) {
            requestMap.get(key)!.components.push(component.name);
          }
        }

        // Tạo error message chi tiết
        const errorDetails = Array.from(requestMap.values())
          .map(
            (req) => `${req.code} (${req.status}): ${req.components.join(", ")}`
          )
          .join("\n  - ");

        throw new ConflictException(
          `Không thể tạo yêu cầu sửa chữa mới vì một số component đang trong yêu cầu sửa chữa khác chưa hoàn thành:\n  - ${errorDetails}\n\nVui lòng đợi các yêu cầu này hoàn thành hoặc loại bỏ các component đang được sửa chữa khỏi yêu cầu mới.`
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

      // Lấy computer từ assetId
      const computer = await this.computerRepository.findOne({
        where: { assetId: createDto.computerAssetId },
      });

      if (!computer) {
        throw new BadRequestException(
          "Không tìm thấy máy tính với assetId này"
        );
      }

      // Kiểm tra software có tồn tại và được cài đặt trong computer này không
      const computerSoftwareList = await this.computerSoftwareRepository
        .createQueryBuilder("cs")
        .leftJoinAndSelect("cs.software", "s")
        .where("cs.computerId = :computerId", { computerId: computer.id })
        .andWhere("s.id IN (:...softwareIds)", {
          softwareIds: createDto.softwareIds,
        })
        .andWhere("s.deletedAt IS NULL")
        .getMany();

      if (computerSoftwareList.length !== createDto.softwareIds.length) {
        const foundSoftwareIds = computerSoftwareList.map(
          (cs) => cs.softwareId
        );
        const notFoundIds = createDto.softwareIds.filter(
          (id) => !foundSoftwareIds.includes(id)
        );
        throw new BadRequestException(
          `Không tìm thấy hoặc chưa cài đặt các software với ID: ${notFoundIds.join(", ")} trong computer này`
        );
      }

      // Thêm thông tin software vào description để theo dõi
      const softwareNames = computerSoftwareList.map((cs) =>
        `${cs.software.name} ${cs.software.version ? "v" + cs.software.version : ""}`.trim()
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

    // 9. Liên kết với components nếu có và cập nhật trạng thái component
    if (components.length > 0) {
      savedRequest.components = components;
      await this.repairRequestRepository.save(savedRequest);

      // ⚠️ QUAN TRỌNG: Cập nhật trạng thái linh kiện thành FAULTY
      // Các linh kiện được báo lỗi cần được đánh dấu là FAULTY
      for (const component of components) {
        // Chỉ update nếu component đang INSTALLED (chưa có vấn đề)
        // Nếu đã FAULTY hoặc PENDING_REPLACEMENT thì giữ nguyên
        if (component.status === ComponentStatus.INSTALLED) {
          component.status = ComponentStatus.FAULTY;
          await this.computerComponentRepository.save(component);
          console.log(
            `✅ [create] Component ${component.id} (${component.name}): INSTALLED → FAULTY`
          );
        } else {
          console.log(
            `ℹ️ [create] Component ${component.id} (${component.name}): Already ${component.status}, skip update`
          );
        }
      }
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

    // 13. Ghi log: Tạo yêu cầu sửa chữa mới
    await this.createRepairLog(
      savedRequest.id,
      currentUser,
      "Tạo yêu cầu sửa chữa",
      undefined,
      RepairStatus.CHỜ_TIẾP_NHẬN,
      `Tạo yêu cầu sửa chữa cho tài sản: ${asset.name} (${asset.ktCode})`
    );

    // 14. Transform và trả về DTO
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
      // Get machineLabel from Computer entity
      let machineLabel: string | undefined;
      if (request.computerAsset.computer) {
        machineLabel = request.computerAsset.computer.machineLabel;
      }

      dto.computerAsset = {
        id: request.computerAsset.id,
        ktCode: request.computerAsset.ktCode,
        name: request.computerAsset.name,
        type: request.computerAsset.type,
        status: request.computerAsset.status,
        machineLabel: machineLabel,
      } as any;

      // Add room info if exists
      if (request.computerAsset.currentRoom) {
        const room = request.computerAsset.currentRoom;
        dto.room = {
          id: room.id,
          name: room.name,
          building: room.building,
          floor: room.floor,
          roomNumber: room.roomNumber,
          unit: room.unit
            ? {
                id: room.unit.id,
                name: room.unit.name,
                code: room.unit.unitCode.toString(),
              }
            : undefined,
        } as any;
      }
    }

    if (request.reporter) {
      dto.reporter = {
        id: request.reporter.id,
        fullName: request.reporter.fullName,
        email: request.reporter.email,
        username: request.reporter.username,
        roles: request.reporter.roles
          ? request.reporter.roles.map((role) => ({
              id: role.id,
              name: role.name,
              code: role.code,
            }))
          : undefined,
      } as any;
    }

    if (request.assignedTechnician) {
      dto.assignedTechnician = {
        id: request.assignedTechnician.id,
        fullName: request.assignedTechnician.fullName,
        email: request.assignedTechnician.email,
        username: request.assignedTechnician.username,
        roles: request.assignedTechnician.roles
          ? request.assignedTechnician.roles.map((role) => ({
              id: role.id,
              name: role.name,
              code: role.code,
            }))
          : undefined,
      } as any;
    }

    // errorType là enum, giữ nguyên giá trị string
    // Không cần transform thành object

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
        "computerAsset.computer",
        "computerAsset.currentRoom",
        "computerAsset.currentRoom.unit",
        "reporter",
        "reporter.roles",
        "assignedTechnician",
        "assignedTechnician.roles",
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

    // Lưu trạng thái cũ để ghi log
    const oldStatus = repairRequest.status;

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

    // Cập nhật thông tin (chỉ update những field có giá trị thực sự)
    const { componentIds, ...dataToUpdate } = updateDto;

    // Chỉ assign những properties không phải undefined để tránh ghi đè null
    Object.keys(dataToUpdate).forEach((key) => {
      if (dataToUpdate[key] !== undefined) {
        repairRequest[key] = dataToUpdate[key];
      }
    });

    // Cập nhật timestamp tương ứng với status
    if (updateDto.status) {
      this.updateTimestampForStatus(repairRequest, updateDto.status);
    }

    const updatedRequest =
      await this.repairRequestRepository.save(repairRequest);

    // ⚠️ Cập nhật trạng thái component thành FAULTY khi chuyển sang CHỜ_THAY_THẾ
    if (
      updateDto.status === RepairStatus.CHỜ_THAY_THẾ &&
      componentIds &&
      componentIds.length > 0
    ) {
      const components = await this.computerComponentRepository.findBy({
        id: In(componentIds),
      });

      for (const component of components) {
        // Chỉ cập nhật nếu component đang ở trạng thái INSTALLED
        // Nếu đã FAULTY hoặc PENDING_REPLACEMENT thì giữ nguyên
        if (component.status === ComponentStatus.INSTALLED) {
          component.status = ComponentStatus.FAULTY;
          await this.computerComponentRepository.save(component);
          console.log(
            `✅ [update] Component ${component.id} (${component.name}): INSTALLED → FAULTY`
          );
        } else {
          console.log(
            `ℹ️ [update] Component ${component.id} (${component.name}): Already ${component.status}, skip update`
          );
        }
      }

      // Liên kết components với repair request
      repairRequest.components = components;
      await this.repairRequestRepository.save(repairRequest);
    }

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

    // Ghi log nếu có thay đổi status hoặc thông tin quan trọng
    if (updateDto.status && updateDto.status !== oldStatus) {
      await this.createRepairLog(
        id,
        currentUser,
        "Cập nhật trạng thái",
        oldStatus,
        updateDto.status,
        updateDto.resolutionNotes || "Cập nhật thông tin yêu cầu sửa chữa"
      );
    }

    return this.transformToResponseDto(fullRequest);
  }

  /**
   * Lấy danh sách yêu cầu theo kỹ thuật viên
   * @param technicianId - ID kỹ thuật viên
   * @returns Danh sách yêu cầu sửa chữa
   */
  async findByTechnician(
    technicianId: string
  ): Promise<RepairRequestResponseDto[]> {
    const repairRequests = await this.repairRequestRepository.find({
      where: { assignedTechnicianId: technicianId },
      relations: [
        "computerAsset",
        "computerAsset.computer",
        "computerAsset.currentRoom",
        "computerAsset.currentRoom.unit",
        "reporter",
        "reporter.roles",
        "assignedTechnician",
        "assignedTechnician.roles",
        "components",
      ],
      order: {
        createdAt: "DESC",
      },
    });

    return repairRequests.map((request) =>
      this.transformToResponseDto(request)
    );
  }

  /**
   * Lấy danh sách yêu cầu theo người báo lỗi
   * @param reporterId - ID người báo lỗi
   * @returns Danh sách yêu cầu sửa chữa
   */
  async findByReporter(
    reporterId: string
  ): Promise<RepairRequestResponseDto[]> {
    // Kiểm tra người dùng có tồn tại không
    const reporter = await this.userRepository.findOne({
      where: { id: reporterId },
    });

    if (!reporter) {
      throw new NotFoundException(
        `Không tìm thấy người dùng với ID: ${reporterId}`
      );
    }

    const repairRequests = await this.repairRequestRepository.find({
      where: { reporterId: reporterId },
      relations: [
        "computerAsset",
        "computerAsset.computer",
        "computerAsset.currentRoom",
        "computerAsset.currentRoom.unit",
        "reporter",
        "reporter.roles",
        "assignedTechnician",
        "assignedTechnician.roles",
        "components",
      ],
      order: {
        createdAt: "DESC",
      },
    });

    return repairRequests.map((request) =>
      this.transformToResponseDto(request)
    );
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

    const oldStatus = repairRequest.status;
    repairRequest.status = RepairStatus.ĐÃ_TIẾP_NHẬN;
    repairRequest.acceptedAt = new Date();

    await this.repairRequestRepository.save(repairRequest);

    // Ghi log
    await this.createRepairLog(
      id,
      currentUser,
      "Tiếp nhận yêu cầu sửa chữa",
      oldStatus,
      RepairStatus.ĐÃ_TIẾP_NHẬN,
      `Kỹ thuật viên ${currentUser.fullName} đã tiếp nhận yêu cầu`
    );

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
    const oldStatus = repairRequest.status;
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

    // Ghi log
    await this.createRepairLog(
      id,
      currentUser,
      "Bắt đầu xử lý yêu cầu",
      oldStatus,
      RepairStatus.ĐANG_XỬ_LÝ,
      startDto.processingNotes ||
        `Kỹ thuật viên ${currentUser.fullName} bắt đầu xử lý`
    );

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

    const oldStatus = repairRequest.status;
    repairRequest.status = RepairStatus.ĐÃ_HOÀN_THÀNH;
    repairRequest.resolutionNotes = resolutionNotes;
    repairRequest.completedAt = new Date();

    // ✅ Cập nhật trạng thái linh kiện về INSTALLED khi repair request hoàn thành
    // ⚠️ LƯU Ý: Chỉ cập nhật nếu repair request KHÔNG phải CHỜ_THAY_THẾ
    // Vì nếu là CHỜ_THAY_THẾ, component có thể đã được thêm vào proposal (PENDING_REPLACEMENT)
    // hoặc đã được thay thế (REMOVED), không nên cập nhật
    // Chỉ cập nhật khi repair request từ ĐANG_XỬ_LÝ → ĐÃ_HOÀN_THÀNH (đã sửa xong)
    if (oldStatus === RepairStatus.ĐANG_XỬ_LÝ) {
      const repairRequestWithComponents = await this.repairRequestRepository.findOne({
        where: { id },
        relations: ["components"],
      });

      if (repairRequestWithComponents?.components) {
        for (const component of repairRequestWithComponents.components) {
          // Chỉ cập nhật nếu component vẫn còn FAULTY (chưa được thay thế)
          // Nếu component đã là PENDING_REPLACEMENT (đang trong proposal) hoặc REMOVED (đã thay thế),
          // thì không cập nhật vì đã được xử lý bởi luồng thay thế
          if (component.status === ComponentStatus.FAULTY) {
            component.status = ComponentStatus.INSTALLED;
            await this.computerComponentRepository.save(component);
            console.log(
              `✅ [completeRequest] Component ${component.id} (${component.name}): FAULTY → INSTALLED (do repair request hoàn thành - đã sửa xong)`
            );
          } else {
            console.log(
              `ℹ️ [completeRequest] Component ${component.id} (${component.name}): Status = ${component.status}, skip update (đã được xử lý bởi luồng thay thế)`
            );
          }
        }
      }
    } else if (oldStatus === RepairStatus.CHỜ_THAY_THẾ) {
      // Nếu repair request từ CHỜ_THAY_THẾ → ĐÃ_HOÀN_THÀNH
      // Component đã được thay thế (REMOVED) hoặc đang trong proposal (PENDING_REPLACEMENT)
      // Không cần cập nhật vì đã được xử lý bởi luồng thay thế
      console.log(
        `ℹ️ [completeRequest] Repair request từ CHỜ_THAY_THẾ → ĐÃ_HOÀN_THÀNH, component đã được xử lý bởi luồng thay thế`
      );
    }

    // Cập nhật trạng thái tài sản về bình thường
    if (repairRequest.computerAsset) {
      repairRequest.computerAsset.status = AssetStatus.IN_USE;
      await this.assetRepository.save(repairRequest.computerAsset);
    }

    await this.repairRequestRepository.save(repairRequest);

    // Ghi log
    await this.createRepairLog(
      id,
      currentUser,
      "Hoàn thành sửa chữa",
      oldStatus,
      RepairStatus.ĐÃ_HOÀN_THÀNH,
      resolutionNotes
    );

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

    const oldStatus = repairRequest.status;
    repairRequest.status = RepairStatus.ĐÃ_HỦY;
    repairRequest.resolutionNotes = `ĐÃ HỦY: ${cancelReason}`;

    // ✅ Khôi phục trạng thái linh kiện về INSTALLED nếu đã được chuyển sang FAULTY
    // Lấy tất cả components liên quan đến repair request này
    const repairRequestWithComponents = await this.repairRequestRepository.findOne({
      where: { id },
      relations: ["components"],
    });

    if (repairRequestWithComponents?.components) {
      for (const component of repairRequestWithComponents.components) {
        // Chỉ rollback nếu component đang ở trạng thái FAULTY
        // (tức là đã được chuyển từ INSTALLED → FAULTY khi tạo repair request)
        // Không rollback nếu component đã REMOVED hoặc PENDING_REPLACEMENT
        if (component.status === ComponentStatus.FAULTY) {
          component.status = ComponentStatus.INSTALLED;
          await this.computerComponentRepository.save(component);
          console.log(
            `✅ [cancelRequest] Component ${component.id} (${component.name}): FAULTY → INSTALLED (do hủy repair request)`
          );
        } else {
          console.log(
            `ℹ️ [cancelRequest] Component ${component.id} (${component.name}): Status = ${component.status}, skip rollback`
          );
        }
      }
    }

    // Khôi phục trạng thái tài sản nếu cần
    if (
      repairRequest.computerAsset &&
      repairRequest.computerAsset.status === AssetStatus.DAMAGED
    ) {
      repairRequest.computerAsset.status = AssetStatus.IN_USE;
      await this.assetRepository.save(repairRequest.computerAsset);
    }

    await this.repairRequestRepository.save(repairRequest);

    // Ghi log
    await this.createRepairLog(
      id,
      currentUser,
      "Hủy yêu cầu sửa chữa",
      oldStatus,
      RepairStatus.ĐÃ_HỦY,
      cancelReason
    );

    return this.findOne(id);
  }

  /**
   * Lấy lịch sử repair logs của một yêu cầu sửa chữa
   * @param repairRequestId - ID của yêu cầu sửa chữa
   * @returns Danh sách repair logs
   */
  async getRepairLogs(repairRequestId: string) {
    // Validate repair request tồn tại
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id: repairRequestId },
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${repairRequestId}`
      );
    }

    // Lấy danh sách logs với thông tin actor
    const logs = await this.repairLogRepository.find({
      where: { repairRequestId },
      relations: ["actor"],
      order: { createdAt: "DESC" },
    });

    return {
      success: true,
      message: "Lấy lịch sử repair logs thành công",
      data: logs.map((log) => ({
        id: log.id,
        action: log.action,
        fromStatus: log.fromStatus,
        toStatus: log.toStatus,
        comment: log.comment,
        createdAt: log.createdAt,
        actor: {
          id: log.actor.id,
          fullName: log.actor.fullName,
          email: log.actor.email,
        },
      })),
    };
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
      .leftJoinAndSelect("asset.computer", "computer")
      .leftJoinAndSelect("request.reporter", "reporter")
      .leftJoinAndSelect("reporter.roles", "reporterRoles")
      .leftJoinAndSelect("request.assignedTechnician", "technician")
      .leftJoinAndSelect("technician.roles", "technicianRoles")
      .leftJoinAndSelect("asset.currentRoom", "room")
      .leftJoinAndSelect("room.unit", "unit")
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
   * Kiểm tra kỹ thuật viên có được phân công cho tầng/tòa nhà cụ thể không
   * - Kiểm tra assignment theo tầng cụ thể (building + floor)
   * - Kiểm tra assignment theo cả tòa nhà (building + floor = null)
   * @param technicianId - ID kỹ thuật viên
   * @param building - Tên tòa nhà
   * @param floor - Tên tầng
   * @returns boolean - true nếu được phân công, false nếu không
   */
  private async isTechnicianAssignedToFloor(
    technicianId: string,
    building: string,
    floor: string
  ): Promise<boolean> {
    // Sử dụng query builder để kiểm tra assignment theo tầng cụ thể hoặc cả tòa nhà
    // Logic: (building = X AND floor = Y) OR (building = X AND floor IS NULL)
    const assignment = await this.technicianAssignmentRepository
      .createQueryBuilder("assignment")
      .where("assignment.technicianId = :technicianId", { technicianId })
      .andWhere("assignment.building = :building", { building })
      .andWhere("(assignment.floor = :floor OR assignment.floor IS NULL)", {
        floor,
      })
      .getOne();

    return !!assignment;
  }

  /**
   * Tạo repair log entry
   * @param repairRequestId - ID của yêu cầu sửa chữa
   * @param actor - Người thực hiện hành động
   * @param action - Hành động thực hiện
   * @param fromStatus - Trạng thái trước (optional)
   * @param toStatus - Trạng thái sau (optional)
   * @param comment - Ghi chú (optional)
   */
  private async createRepairLog(
    repairRequestId: string,
    actor: User,
    action: string,
    fromStatus?: RepairStatus,
    toStatus?: RepairStatus,
    comment?: string
  ): Promise<void> {
    try {
      const log = this.repairLogRepository.create({
        repairRequestId,
        actorId: actor.id,
        action,
        fromStatus,
        toStatus,
        comment,
      });

      await this.repairLogRepository.save(log);

      console.log(
        `📝 Repair Log: ${action} | ${fromStatus || ""} → ${toStatus || ""} | By: ${actor.fullName}`
      );
    } catch (error) {
      console.error("❌ Lỗi khi tạo repair log:", error);
      // Không throw error để không ảnh hưởng đến flow chính
    }
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
        .andWhere("(assignment.floor = :floor OR assignment.floor IS NULL)", {
          floor,
        })
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
      .andWhere("(assignment.floor = :floor OR assignment.floor IS NULL)", {
        floor: room.floor,
      })
      .andWhere("technician.deletedAt IS NULL")
      .getMany();

    return assignments.map((a) => a.technician);
  }

  /**
   * Ghi nhận và xử lý lỗi trực tiếp tại hiện trường
   * Endpoint cho kỹ thuật viên để tạo repair request VÀ cập nhật kết quả xử lý trong 1 lần
   *
   * ⚠️ LƯU Ý: Status chỉ có thể set thành ĐANG_XỬ_LÝ hoặc ĐÃ_HOÀN_THÀNH
   * - ĐANG_XỬ_LÝ: Khi cần thay thế linh kiện (sẽ chuyển sang CHỜ_THAY_THẾ khi phiếu đề xuất được duyệt)
   * - ĐÃ_HOÀN_THÀNH: Khi đã sửa xong không cần thay thế
   *
   * @param createDto - Dữ liệu tạo và xử lý repair request
   * @param currentUser - Kỹ thuật viên đang xử lý
   * @returns RepairRequestResponseDto
   */
  async createAndProcess(
    createDto: CreateAndProcessRepairRequestDto,
    currentUser: User
  ): Promise<RepairRequestResponseDto> {
    // Validate business logic nếu có finalStatus
    if (createDto.finalStatus) {
      this.validateCreateAndProcess(createDto);
    }

    // 0. Kiểm tra quyền truy cập tầng tòa nhà cho kỹ thuật viên
    // Admin và tổ trưởng kỹ thuật không cần kiểm tra, chỉ kỹ thuật viên thường mới cần
    const isRegularTechnician = 
      this.isUserTechnician(currentUser) && 
      !this.isAdmin(currentUser) &&
      !currentUser.roles?.some((role) => role.code === "TO_TRUONG_KY_THUAT");
    
    if (isRegularTechnician) {
      // Lấy thông tin asset để kiểm tra building và floor
      const asset = await this.assetRepository.findOne({
        where: { id: createDto.computerAssetId },
        relations: ["currentRoom"],
      });

      if (!asset) {
        throw new NotFoundException(
          `Không tìm thấy tài sản với ID: ${createDto.computerAssetId}`
        );
      }

      if (!asset.currentRoom) {
        throw new BadRequestException(
          "Tài sản này chưa được gán vào phòng, không thể báo lỗi"
        );
      }

      // Kiểm tra kỹ thuật viên có được phân công cho tầng/tòa nhà này không
      const isAssigned = await this.isTechnicianAssignedToFloor(
        currentUser.id,
        asset.currentRoom.building,
        asset.currentRoom.floor
      );

      if (!isAssigned) {
        throw new ForbiddenException(
          `Bạn không được phân công cho tầng ${asset.currentRoom.floor} tòa ${asset.currentRoom.building}. Chỉ có thể báo lỗi ở các tầng tòa được phân công.`
        );
      }
    }

    // 1. Tạo repair request sử dụng logic create() hiện tại
    const repairRequest = await this.create(createDto, currentUser);

    // 2. Tự động gán kỹ thuật viên và set status ĐANG_XỬ_LÝ
    const queryRunner =
      this.repairRequestRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const requestToUpdate = await queryRunner.manager.findOne(RepairRequest, {
        where: { id: repairRequest.id },
        relations: ["computerAsset"],
      });

      if (!requestToUpdate) {
        throw new NotFoundException("Không tìm thấy repair request vừa tạo");
      }

      // Tự động gán kỹ thuật viên và set status ĐANG_XỬ_LÝ
      requestToUpdate.assignedTechnicianId = currentUser.id;
      requestToUpdate.status = RepairStatus.ĐANG_XỬ_LÝ;

      // Lưu ghi chú xử lý nếu có
      if (createDto.resolutionNotes) {
        requestToUpdate.resolutionNotes = createDto.resolutionNotes;
      }

      // Xử lý theo finalStatus
      if (createDto.finalStatus === RepairStatus.ĐÃ_HOÀN_THÀNH) {
        // Nếu finalStatus = ĐÃ_HOÀN_THÀNH → Set completedAt và update asset status
        requestToUpdate.status = RepairStatus.ĐÃ_HOÀN_THÀNH;
        requestToUpdate.completedAt = new Date();

        // Update asset status từ DAMAGED → IN_USE
        const asset = requestToUpdate.computerAsset;
        if (asset && asset.status === AssetStatus.DAMAGED) {
          asset.status = AssetStatus.IN_USE;
          await queryRunner.manager.save(asset);
        }
      } else if (createDto.finalStatus === RepairStatus.CHỜ_THAY_THẾ) {
        // 🔥 Nếu finalStatus = CHỜ_THAY_THẾ → Chuyển sang status CHỜ_THAY_THẾ ngay
        requestToUpdate.status = RepairStatus.CHỜ_THAY_THẾ;
        // Không set completedAt vì chưa hoàn thành
        // Asset status vẫn giữ DAMAGED vì cần thay thế linh kiện

        // ⚠️ LƯU Ý: KHÔNG cập nhật component status ở đây!
        // Component status chỉ chuyển sang PENDING_REPLACEMENT khi:
        // 1. Kỹ thuật viên TẠO replacement proposal
        // 2. Trong replacement-proposals.service.ts -> create() method
        // Lý do: Phải có phiếu đề xuất chính thức mới đánh dấu component đang chờ thay thế
      }

      await queryRunner.manager.save(requestToUpdate);

      // Ghi log cho transition CHỜ_TIẾP_NHẬN → ĐANG_XỬ_LÝ
      await this.createRepairLog(
        repairRequest.id,
        currentUser,
        "Tiếp nhận và bắt đầu xử lý ngay",
        RepairStatus.CHỜ_TIẾP_NHẬN,
        RepairStatus.ĐANG_XỬ_LÝ,
        createDto.resolutionNotes || "Kỹ thuật viên xử lý ngay tại hiện trường"
      );

      // Ghi log tùy theo finalStatus
      if (createDto.finalStatus === RepairStatus.ĐÃ_HOÀN_THÀNH) {
        await this.createRepairLog(
          repairRequest.id,
          currentUser,
          "Hoàn thành sửa chữa",
          RepairStatus.ĐANG_XỬ_LÝ,
          RepairStatus.ĐÃ_HOÀN_THÀNH,
          createDto.resolutionNotes || "Đã xử lý xong"
        );
      } else if (createDto.finalStatus === RepairStatus.CHỜ_THAY_THẾ) {
        // 🔥 Ghi log khi chuyển sang CHỜ_THAY_THẾ
        await this.createRepairLog(
          repairRequest.id,
          currentUser,
          "Linh kiện cần thay thế",
          RepairStatus.ĐANG_XỬ_LÝ,
          RepairStatus.CHỜ_THAY_THẾ,
          createDto.resolutionNotes ||
            "Linh kiện không thể sửa chữa, cần thay thế"
        );
      }

      await queryRunner.commitTransaction();

      console.log(
        `✅ Đã xử lý repair request ${repairRequest.requestCode} với status: ${requestToUpdate.status}`
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error("Lỗi khi cập nhật kết quả xử lý:", error);
      throw error;
    } finally {
      await queryRunner.release();
    }

    // 3. Return full data với relations
    return this.findOne(repairRequest.id);
  }

  /**
   * Validate business logic cho createAndProcess
   * @param dto - CreateAndProcessRepairRequestDto
   * @throws BadRequestException nếu dữ liệu không hợp lệ
   */
  private validateCreateAndProcess(
    dto: CreateAndProcessRepairRequestDto
  ): void {
    // 1. Validate: finalStatus chỉ có thể là ĐÃ_HOÀN_THÀNH, CHỜ_THAY_THẾ hoặc không set (default ĐANG_XỬ_LÝ)
    if (dto.finalStatus) {
      const allowedStatuses = [
        RepairStatus.ĐÃ_HOÀN_THÀNH,
        RepairStatus.CHỜ_THAY_THẾ,
      ];
      if (!allowedStatuses.includes(dto.finalStatus)) {
        throw new BadRequestException(
          `finalStatus chỉ có thể là ĐÃ_HOÀN_THÀNH hoặc CHỜ_THAY_THẾ`
        );
      }

      // Nếu có finalStatus thì bắt buộc phải có resolutionNotes
      if (!dto.resolutionNotes) {
        throw new BadRequestException(
          "Bắt buộc phải nhập ghi chú xử lý (resolutionNotes) khi chọn trạng thái cuối cùng"
        );
      }
    }

    // 2. Validate: Lỗi phần mềm phải có softwareIds
    if (dto.errorType === ErrorType.MAY_HU_PHAN_MEM) {
      if (!dto.softwareIds || dto.softwareIds.length === 0) {
        throw new BadRequestException(
          "Bắt buộc phải chọn ít nhất 1 phần mềm (softwareIds) khi errorType là MAY_HU_PHAN_MEM"
        );
      }

      // Lỗi phần mềm chỉ có thể có status ĐÃ_HOÀN_THÀNH
      if (dto.finalStatus && dto.finalStatus !== RepairStatus.ĐÃ_HOÀN_THÀNH) {
        throw new BadRequestException(
          "Lỗi phần mềm (MAY_HU_PHAN_MEM) chỉ có thể có trạng thái cuối cùng là ĐÃ_HOÀN_THÀNH"
        );
      }
    }

    // 3. Validate: Lỗi phần cứng phải có componentIds
    if (dto.errorType && dto.errorType !== ErrorType.MAY_HU_PHAN_MEM) {
      if (!dto.componentIds || dto.componentIds.length === 0) {
        throw new BadRequestException(
          "Bắt buộc phải chọn ít nhất 1 linh kiện (componentIds) khi xử lý lỗi phần cứng"
        );
      }
    }
  }

  /**
   * Xóa yêu cầu sửa chữa
   * @param id - ID của yêu cầu sửa chữa cần xóa
   * @param currentUser - Người dùng hiện tại
   * @returns Thông báo xóa thành công
   * @throws NotFoundException nếu không tìm thấy yêu cầu
   * @throws BadRequestException nếu yêu cầu đang liên kết với proposal chưa hoàn thành
   * @throws ForbiddenException nếu người dùng không có quyền xóa
   */
  async remove(id: string, currentUser: User): Promise<{ message: string }> {
    // 1. Kiểm tra yêu cầu sửa chữa có tồn tại không
    const repairRequest = await this.repairRequestRepository.findOne({
      where: { id },
      relations: ["computerAsset", "components"],
    });

    if (!repairRequest) {
      throw new NotFoundException(
        `Không tìm thấy yêu cầu sửa chữa với ID: ${id}`
      );
    }

    // 2. Kiểm tra quyền xóa
    // Chỉ cho phép:
    // - Người báo lỗi (reporter) xóa yêu cầu của mình khi status là CHỜ_TIẾP_NHẬN
    // - Admin/Tổ trưởng có thể xóa bất kỳ yêu cầu nào
    const userRoles = currentUser.roles?.map((r) => r.code) || [];
    const isAdmin = userRoles.some(
      (role) => role === "ADMIN" || role === "LEAD_TECHNICIAN"
    );
    const isReporter = repairRequest.reporterId === currentUser.id;
    const canDeleteByStatus =
      repairRequest.status === RepairStatus.CHỜ_TIẾP_NHẬN;

    if (!isAdmin && (!isReporter || !canDeleteByStatus)) {
      throw new ForbiddenException(
        "Bạn không có quyền xóa yêu cầu sửa chữa này. Chỉ có thể xóa yêu cầu ở trạng thái CHỜ_TIẾP_NHẬN hoặc bạn phải là Admin/Tổ trưởng."
      );
    }

    // 3. Kiểm tra xem có proposal nào đang liên kết với repair request không
    const linkedProposals = await this.repairRequestRepository.manager.query(
      `
      SELECT 
        prr."proposalId",
        rp."proposalCode",
        rp.status as proposal_status
      FROM proposal_repair_requests prr
      INNER JOIN replacement_proposals rp ON prr."proposalId" = rp.id
      WHERE prr."repairRequestId" = $1
      `,
      [id]
    );

    if (linkedProposals.length > 0) {
      const proposalCodes = linkedProposals
        .map((p: any) => `${p.proposalCode} (${p.proposal_status})`)
        .join(", ");
      throw new BadRequestException(
        `Không thể xóa yêu cầu sửa chữa này vì đang liên kết với các đề xuất thay thế: ${proposalCodes}. Vui lòng hủy liên kết hoặc xóa các đề xuất trước.`
      );
    }

    // 4. Sử dụng transaction để đảm bảo tính nhất quán
    const queryRunner =
      this.repairRequestRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 4.1. Xóa tất cả repair logs (do có NO ACTION constraint)
      await queryRunner.manager.delete(RepairLog, {
        repairRequestId: id,
      });

      // 4.2. Xóa repair request (repair_request_components sẽ tự động xóa do CASCADE)
      await queryRunner.manager.delete(RepairRequest, { id });

      // 4.3. Kiểm tra và cập nhật trạng thái asset nếu cần
      // Nếu không còn repair request nào cho asset này, và asset đang ở trạng thái DAMAGED,
      // thì có thể chuyển về IN_USE (nếu asset không có vấn đề khác)
      const remainingRepairs = await queryRunner.manager.count(RepairRequest, {
        where: {
          computerAssetId: repairRequest.computerAssetId,
          status: In([
            RepairStatus.CHỜ_TIẾP_NHẬN,
            RepairStatus.ĐÃ_TIẾP_NHẬN,
            RepairStatus.ĐANG_XỬ_LÝ,
            RepairStatus.CHỜ_THAY_THẾ,
          ]),
        },
      });

      if (remainingRepairs === 0) {
        const asset = await queryRunner.manager.findOne(Asset, {
          where: { id: repairRequest.computerAssetId },
        });

        if (asset && asset.status === AssetStatus.DAMAGED) {
          // Kiểm tra xem asset có component nào đang FAULTY không
          const computer = await queryRunner.manager.findOne(Computer, {
            where: { assetId: asset.id },
          });

          if (computer) {
            const faultyComponents = await queryRunner.manager.count(
              ComputerComponent,
              {
                where: {
                  computerAssetId: computer.assetId,
                  status: ComponentStatus.FAULTY,
                },
              }
            );

            // Chỉ chuyển về IN_USE nếu không còn component nào bị lỗi
            if (faultyComponents === 0) {
              await queryRunner.manager.update(
                Asset,
                { id: asset.id },
                { status: AssetStatus.IN_USE }
              );
            }
          }
        }
      }

      // 4.4. Commit transaction
      await queryRunner.commitTransaction();

      return {
        message: `Xóa yêu cầu sửa chữa ${repairRequest.requestCode} thành công`,
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
