import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder } from "typeorm";
import { CreateComputerDto } from "./dto/create-computer.dto";
import { UpdateComputerDto } from "./dto/update-computer.dto";
import { AvailableComponentsFilterDto } from "./dto/available-components-filter.dto";
import { GetComputersFilterDto } from "./dto/get-computers-filter.dto";
import { GetComputerDetailResponseDto } from "./dto/get-computer-detail-response.dto";
import { Computer } from "../../entities/computer.entity";
import { ComputerComponent } from "../../entities/computer-component.entity";
import { RepairRequest } from "../../entities/repair-request.entity";
import { User } from "../../entities/user.entity";
import { RepairStatus } from "../../common/shared/RepairStatus";
import { ComponentStatus } from "../../common/shared/ComponentStatus";
import { AssetStatus } from "../../common/shared/AssetStatus";

@Injectable()
export class ComputerService {
  constructor(
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>,
    @InjectRepository(ComputerComponent)
    private readonly componentRepository: Repository<ComputerComponent>,
    @InjectRepository(RepairRequest)
    private readonly repairRequestRepository: Repository<RepairRequest>
  ) {}

  /**
   * Lấy danh sách tất cả máy tính trong một phòng cụ thể
   * Bao gồm thông tin asset, room và các components của máy tính
   *
   * @param roomId - UUID của phòng cần tìm
   * @returns Danh sách máy tính kèm thông tin chi tiết
   * @throws NotFoundException nếu không tìm thấy máy tính nào
   */
  async getComputersByRoom(roomId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      throw new NotFoundException(`ID phòng không hợp lệ: ${roomId}`);
    }

    // Query computers with relations using QueryBuilder for better control
    const computers = await this.computerRepository
      .createQueryBuilder("computer")
      .leftJoinAndSelect("computer.asset", "asset")
      .leftJoinAndSelect("computer.room", "room")
      .leftJoinAndSelect("computer.components", "component")
      .where("computer.roomId = :roomId", { roomId })
      .orderBy("computer.machineLabel", "ASC")
      .addOrderBy("component.componentType", "ASC")
      .getMany();

    // Kiểm tra nếu không có máy tính nào trong phòng
    if (!computers || computers.length === 0) {
      throw new NotFoundException(
        `Không tìm thấy máy tính nào trong phòng với ID: ${roomId}`
      );
    }

    // Transform data để trả về thông tin có cấu trúc tốt hơn
    const result = computers.map((computer) => ({
      id: computer.id,
      machineLabel: computer.machineLabel,
      notes: computer.notes,
      asset: computer.asset
        ? {
            id: computer.asset.id,
            name: computer.asset.name,
            ktCode: computer.asset.ktCode,
            fixedCode: computer.asset.fixedCode,
            status: computer.asset.status,
            specs: computer.asset.specs,
            entrydate: computer.asset.entrydate,
            origin: computer.asset.origin,
          }
        : null,
      room: computer.room
        ? {
            id: computer.room.id,
            name: computer.room.name,
            roomCode: computer.room.roomCode,
          }
        : null,
      components:
        computer.components?.map((comp) => ({
          id: comp.id,
          componentType: comp.componentType,
          name: comp.name,
          componentSpecs: comp.componentSpecs,
          serialNumber: comp.serialNumber,
          status: comp.status,
          installedAt: comp.installedAt,
          notes: comp.notes,
        })) || [],
      componentCount: computer.components?.length || 0,
    }));

    return {
      success: true,
      message: `Tìm thấy ${computers.length} máy tính trong phòng`,
      data: {
        roomId,
        totalComputers: computers.length,
        computers: result,
      },
    };
  }
  /**
   * Lấy danh sách tất cả máy tính
   * Bao gồm thông tin asset, room và các components của máy tính
   *
   * @returns Danh sách máy tính kèm thông tin chi tiết
   * @throws NotFoundException nếu không tìm thấy máy tính nào
   */

  async getAllComputers() {
    // Query computers with relations using QueryBuilder for better control
    const computers = await this.computerRepository
      .createQueryBuilder("computer")
      .leftJoinAndSelect("computer.asset", "asset")
      .leftJoinAndSelect("computer.room", "room")
      .leftJoinAndSelect("computer.components", "component")
      .orderBy("computer.machineLabel", "ASC")
      .addOrderBy("component.componentType", "ASC")
      .getMany();
    // Kiểm tra nếu không có máy tính nào
    if (!computers || computers.length === 0) {
      throw new NotFoundException(`Không tìm thấy máy tính nào trong hệ thống`);
    }
    // Transform data để trả về thông tin có cấu trúc tốt hơn
    // Transform data để trả về thông tin có cấu trúc tốt hơn
    const result = computers.map((computer) => ({
      id: computer.id,
      machineLabel: computer.machineLabel,
      notes: computer.notes,
      asset: computer.asset
        ? {
            id: computer.asset.id,
            name: computer.asset.name,
            ktCode: computer.asset.ktCode,
            fixedCode: computer.asset.fixedCode,
            status: computer.asset.status,
            specs: computer.asset.specs,
            entrydate: computer.asset.entrydate,
            origin: computer.asset.origin,
          }
        : null,
      room: computer.room
        ? {
            id: computer.room.id,
            name: computer.room.name,
            roomCode: computer.room.roomCode,
          }
        : null,
      components:
        computer.components?.map((comp) => ({
          id: comp.id,
          componentType: comp.componentType,
          name: comp.name,
          componentSpecs: comp.componentSpecs,
          serialNumber: comp.serialNumber,
          status: comp.status,
          installedAt: comp.installedAt,
          notes: comp.notes,
        })) || [],
      componentCount: computer.components?.length || 0,
    }));

    return {
      success: true,
      message: `Tìm thấy ${computers.length} máy tính trong hệ thống`,
      data: result,
    };
  }

  /**
   * Lấy tất cả components của một máy tính cụ thể
   *
   * @param computerId - UUID của máy tính
   * @returns Danh sách components với thông tin chi tiết
   * @throws NotFoundException nếu không tìm thấy máy tính
   */
  async getComponentsByComputer(computerId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(computerId)) {
      throw new NotFoundException(`ID máy tính không hợp lệ: ${computerId}`);
    }

    // Tìm máy tính và load components
    const computer = await this.computerRepository
      .createQueryBuilder("computer")
      .leftJoinAndSelect("computer.asset", "asset")
      .leftJoinAndSelect("computer.room", "room")
      .leftJoinAndSelect("computer.components", "component")
      .where("computer.id = :computerId", { computerId })
      .orderBy("component.componentType", "ASC")
      .addOrderBy("component.installedAt", "DESC")
      .getOne();

    // Kiểm tra máy tính có tồn tại không
    if (!computer) {
      throw new NotFoundException(
        `Không tìm thấy máy tính với ID: ${computerId}`
      );
    }

    // Transform components data
    const components =
      computer.components?.map((comp) => ({
        id: comp.id,
        componentType: comp.componentType,
        name: comp.name,
        componentSpecs: comp.componentSpecs,
        serialNumber: comp.serialNumber,
        status: comp.status,
        installedAt: comp.installedAt,
        removedAt: comp.removedAt,
        notes: comp.notes,
      })) || [];

    // Thống kê components theo loại
    const componentStats = components.reduce(
      (acc, comp) => {
        const type = comp.componentType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      message: `Tìm thấy ${components.length} linh kiện của máy tính`,
      data: {
        computer: {
          id: computer.id,
          machineLabel: computer.machineLabel,
          asset: computer.asset
            ? {
                id: computer.asset.id,
                name: computer.asset.name,
                ktCode: computer.asset.ktCode,
                fixedCode: computer.asset.fixedCode,
                status: computer.asset.status,
              }
            : null,
          room: computer.room
            ? {
                id: computer.room.id,
                name: computer.room.name,
                roomCode: computer.room.roomCode,
              }
            : null,
        },
        totalComponents: components.length,
        componentStats,
        components,
      },
    };
  }

  /**
   * Lấy tất cả components của một tài sản máy tính (theo Asset ID)
   *
   * @param assetId - UUID của tài sản
   * @returns Danh sách components với thông tin chi tiết
   * @throws NotFoundException nếu không tìm thấy tài sản hoặc máy tính
   */
  async getComponentsByAssetId(assetId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assetId)) {
      throw new NotFoundException(`ID tài sản không hợp lệ: ${assetId}`);
    }

    // Tìm máy tính theo assetId
    const computer = await this.computerRepository
      .createQueryBuilder("computer")
      .leftJoinAndSelect("computer.asset", "asset")
      .leftJoinAndSelect("computer.room", "room")
      .leftJoinAndSelect("computer.components", "component")
      .where("computer.assetId = :assetId", { assetId })
      .orderBy("component.componentType", "ASC")
      .addOrderBy("component.installedAt", "DESC")
      .getOne();

    // Kiểm tra máy tính có tồn tại không
    if (!computer) {
      throw new NotFoundException(
        `Không tìm thấy máy tính với Asset ID: ${assetId}`
      );
    }

    // Transform components data
    const components =
      computer.components?.map((comp) => ({
        id: comp.id,
        componentType: comp.componentType,
        name: comp.name,
        componentSpecs: comp.componentSpecs,
        serialNumber: comp.serialNumber,
        status: comp.status,
        installedAt: comp.installedAt,
        removedAt: comp.removedAt,
        notes: comp.notes,
      })) || [];

    // Thống kê components theo loại
    const componentStats = components.reduce(
      (acc, comp) => {
        const type = comp.componentType;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      success: true,
      message:
        components.length === 0
          ? "Máy tính này chưa có linh kiện nào"
          : `Tìm thấy ${components.length} linh kiện của tài sản ${computer.asset?.name || ""}`,
      data: {
        computer: {
          id: computer.id,
          machineLabel: computer.machineLabel,
          asset: computer.asset
            ? {
                id: computer.asset.id,
                name: computer.asset.name,
                ktCode: computer.asset.ktCode,
                status: computer.asset.status,
              }
            : null,
          room: computer.room
            ? {
                id: computer.room.id,
                name: computer.room.name,
                roomCode: computer.room.roomCode,
              }
            : null,
        },
        totalComponents: components.length,
        componentStats,
        components,
      },
    };
  }

  /**
   * Lấy danh sách linh kiện khả dụng từ các yêu cầu sửa chữa mà kỹ thuật viên đảm nhận
   * Dùng để kỹ thuật viên chọn linh kiện khi lập đề xuất thay thế
   * Chỉ lấy các yêu cầu sửa chữa được phân công cho kỹ thuật viên hiện tại
   * 
   * @param filter - Bộ lọc và phân trang
   * @param currentUser - Kỹ thuật viên hiện tại
   * @returns Danh sách linh kiện khả dụng từ repair requests
   */
  async getAvailableComponents(
    filter: AvailableComponentsFilterDto,
    currentUser: User
  ) {
    const {
      requestCode,
      componentType,
      search,
      building,
      floor,
      roomName,
      excludeInProposal = true,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "DESC",
    } = filter;

    console.log(`🔍 [getAvailableComponents] User: ${currentUser.fullName}, Filter:`, {
      requestCode,
      componentType,
      search,
      building,
      floor,
      roomName,
      excludeInProposal,
      page,
      limit,
    });

    // ✅ THAY ĐỔI: Query trực tiếp từ computer_components thay vì từ repair_requests
    // Lấy TẤT CẢ FAULTY components, không giới hạn theo repair requests
    // Relationships: computer_components.computerAssetId → computers.id → assets.id → rooms.id
    const queryBuilder = this.componentRepository
      .createQueryBuilder("cc")
      .leftJoin("computers", "c", 'c.id = cc."computerAssetId"') // ✅ Join với computers.id
      .leftJoin("assets", "a", 'a.id = c."assetId"') // ✅ Join assets qua computers.assetId
      .leftJoin("rooms", "r", 'r.id = a.current_room_id') // ✅ Join rooms qua assets.current_room_id
      // Left join với repair_requests để lấy thông tin (nếu có)
      .leftJoin(
        "repair_request_components",
        "rrc",
        'rrc."componentId" = cc.id'
      )
      .leftJoin(
        "repair_requests",
        "rr",
        'rr.id = rrc."repairRequestId" AND rr.status IN (:...activeStatuses)',
        {
          activeStatuses: [
            RepairStatus.CHỜ_TIẾP_NHẬN,
            RepairStatus.ĐÃ_TIẾP_NHẬN,
            RepairStatus.ĐANG_XỬ_LÝ,
            RepairStatus.CHỜ_THAY_THẾ,
          ],
        }
      )
      .select([
        "cc.id as componentId",
        "cc.name as componentName",
        'cc."componentType" as componentType',
        'cc."componentSpecs" as componentSpecs',
        "cc.status as componentStatus",
        'cc."installedAt" as installedAt',
        "a.id as assetId",
        "a.name as assetName",
        'a.kt_code as ktCode',
        "r.name as roomName",
        "r.building as buildingName",
        "r.floor as floor",
        'c."machineLabel" as machineLabel',
        // Thông tin repair request (có thể null nếu component chưa có repair request)
        "rr.id as repairRequestId",
        'rr."requestCode" as requestCode',
        "rr.status as repairStatus",
        "rr.description as repairDescription",
        'rr."createdAt" as repairCreatedAt',
      ])
      // ⚠️ QUAN TRỌNG: CHỈ LẤY COMPONENTS CÓ STATUS = FAULTY
      .where("cc.status = :faultyStatus", {
        faultyStatus: ComponentStatus.FAULTY,
      });

    // Filter by request code (YCSC) - optional, có thể không có
    if (requestCode) {
      queryBuilder.andWhere('rr."requestCode" ILIKE :requestCode', {
        requestCode: `%${requestCode}%`,
      });
    }

    // Filter by component type
    if (componentType && componentType.length > 0) {
      queryBuilder.andWhere('cc."componentType" IN (:...componentType)', {
        componentType,
      });
    }

    // Search by component name, asset name, or kt code
    if (search) {
      queryBuilder.andWhere(
        '(cc.name ILIKE :search OR a.name ILIKE :search OR a.kt_code ILIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by building
    if (building) {
      queryBuilder.andWhere("r.building = :building", { building });
    }

    // Filter by floor
    if (floor) {
      queryBuilder.andWhere("r.floor = :floor", { floor });
    }

    // Filter by room
    if (roomName) {
      queryBuilder.andWhere("r.name = :roomName", { roomName });
    }

    // Exclude components already in replacement proposals (status = PENDING_REPLACEMENT)
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
    let orderByField = 'cc."installedAt"';
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
      case "createdAt":
        orderByField = 'rr."createdAt"';
        break;
      default:
        orderByField = 'cc."installedAt"';
    }

    queryBuilder.orderBy(orderByField, sortOrder);

    // Pagination
    const skip = (page - 1) * limit;
    queryBuilder.offset(skip).limit(limit);

    const rawResults = await queryBuilder.getRawMany();

    console.log(`✅ [getAvailableComponents] Found ${rawResults.length} FAULTY components (total before pagination: ${total})`);
    
    // Debug: Log first few components
    if (rawResults.length > 0) {
      console.log('📦 Sample components:', rawResults.slice(0, 3).map(r => ({
        id: r.componentid,
        name: r.componentname,
        status: r.componentstatus,
        type: r.componenttype,
        assetName: r.assetname,
        requestCode: r.requestcode || 'No repair request',
      })));
    }

    // Map to DTO
    const data = rawResults.map((row) => ({
      componentId: row.componentid,
      componentName: row.componentname,
      componentType: row.componenttype,
      componentSpecs: row.componentspecs,
      componentStatus: row.componentstatus,
      installedAt: row.installedat,
      assetId: row.assetid,
      assetName: row.assetname,
      ktCode: row.ktcode,
      roomName: row.roomname,
      buildingName: row.buildingname,
      floor: row.floor,
      machineLabel: row.machinelabel,
      // Thông tin repair request (nullable - có thể không có)
      repairRequestId: row.repairrequestid || null,
      requestCode: row.requestcode || null,
      repairStatus: row.repairstatus || null,
      repairDescription: row.repairdescription || null,
      repairCreatedAt: row.repaircreatedat || null,
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
   * Lấy danh sách máy tính với filter và pagination
   * Dành cho giao diện quản lý thiết bị của kỹ thuật viên
   * 
   * @param filterDto - DTO chứa các tham số filter và pagination
   * @returns Danh sách máy tính với thông tin đầy đủ và pagination
   */
  async getComputersWithFilter(filterDto: GetComputersFilterDto) {
    const {
      search,
      status,
      building,
      floor,
      roomName,
      roomId,
      categoryName,
      page = 1,
      limit = 12,
      sortBy = "machineLabel",
      sortOrder = "ASC",
    } = filterDto;

    // Step 1: Query computers WITHOUT components join để pagination chính xác
    // Lấy bảng computers làm trung tâm
    const queryBuilder = this.computerRepository
      .createQueryBuilder("computer")
      .leftJoinAndSelect("computer.asset", "asset")
      .leftJoinAndSelect("asset.category", "category")
      .leftJoinAndSelect("computer.room", "room")
      // ❌ KHÔNG join components ở đây để tránh duplicate rows
      .where("asset.shape = :shape", { shape: "COMPUTER" })
      .andWhere("asset.deletedAt IS NULL");

    // Apply filters
    if (search) {
      queryBuilder.andWhere(
        "(asset.name ILIKE :search OR asset.ktCode ILIKE :search OR asset.fixedCode ILIKE :search OR computer.machineLabel ILIKE :search)",
        { search: `%${search}%` }
      );
    }

    if (status && status.length > 0) {
      queryBuilder.andWhere("asset.status IN (:...status)", { status });
    }

    if (building) {
      queryBuilder.andWhere("room.building = :building", { building });
    }

    if (floor) {
      queryBuilder.andWhere("room.floor = :floor", { floor });
    }

    if (roomName) {
      queryBuilder.andWhere("room.name ILIKE :roomName", {
        roomName: `%${roomName}%`,
      });
    }

    if (roomId) {
      queryBuilder.andWhere("computer.roomId = :roomId", { roomId });
    }

    if (categoryName) {
      queryBuilder.andWhere("category.name ILIKE :categoryName", {
        categoryName: `%${categoryName}%`,
      });
    }

    // Apply sorting
    const sortMapping: Record<string, string> = {
      machineLabel: "computer.machineLabel",
      assetName: "asset.name",
      status: "asset.status",
      entrydate: "asset.entrydate",
      roomName: "room.name",
    };

    const sortField = sortMapping[sortBy] || "computer.machineLabel";
    queryBuilder.orderBy(sortField, sortOrder);

    // Get total count before pagination
    const total = await queryBuilder.getCount();

    // Apply pagination trên computers (không bị ảnh hưởng bởi components)
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Execute query để lấy computers
    const computers = await queryBuilder.getMany();

    // Step 2: Load components cho từng computer
    // Lấy tất cả computer IDs
    const computerIds = computers.map((c) => c.id);

    // Query components cho tất cả computers một lần
    let componentsMap: Map<string, any[]> = new Map();
    
    if (computerIds.length > 0) {
      const components = await this.componentRepository
        .createQueryBuilder("component")
        .where("component.computerAssetId IN (:...computerIds)", { computerIds })
        .orderBy("component.componentType", "ASC")
        .getMany();

      // Group components by computer ID
      components.forEach((comp) => {
        if (!componentsMap.has(comp.computerAssetId)) {
          componentsMap.set(comp.computerAssetId, []);
        }
        componentsMap.get(comp.computerAssetId)!.push(comp);
      });
    }

    // Step 3: Transform data với components đã load
    const result = computers.map((computer) => {
      // Get components cho computer này từ map
      const computerComponents = componentsMap.get(computer.id) || [];

      return {
        id: computer.id,
        machineLabel: computer.machineLabel,
        notes: computer.notes,
        asset: computer.asset
          ? {
              id: computer.asset.id,
              ktCode: computer.asset.ktCode,
              fixedCode: computer.asset.fixedCode,
              name: computer.asset.name,
              specs: computer.asset.specs,
              status: computer.asset.status,
              entrydate: computer.asset.entrydate,
              origin: computer.asset.origin,
              categoryId: computer.asset.categoryId,
              categoryName: computer.asset.category?.name,
            }
          : null,
        room: computer.room
          ? {
              id: computer.room.id,
              name: computer.room.name,
              roomNumber: computer.room.roomNumber,
              roomCode: computer.room.roomCode,
              building: computer.room.building,
              floor: computer.room.floor,
            }
          : null,
        components: computerComponents.map((comp) => ({
          id: comp.id,
          componentType: comp.componentType,
          name: comp.name,
          componentSpecs: comp.componentSpecs,
          serialNumber: comp.serialNumber,
          status: comp.status,
          installedAt: comp.installedAt,
        })),
        componentCount: computerComponents.length,
      };
    });

    // Calculate summary statistics
    const allComputers = await this.computerRepository
      .createQueryBuilder("computer")
      .leftJoinAndSelect("computer.asset", "asset")
      .where("asset.shape = :shape", { shape: "COMPUTER" })
      .andWhere("asset.deletedAt IS NULL")
      .getMany();

    const byStatus: Record<string, number> = {};
    allComputers.forEach((comp) => {
      const status = comp.asset?.status || "UNKNOWN";
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    return {
      success: true,
      message: `Lấy danh sách máy tính thành công`,
      data: {
        computers: result,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
        summary: {
          totalComputers: allComputers.length,
          byStatus,
        },
      },
    };
  }

  /**
   * Lấy thông tin chi tiết đầy đủ của một máy tính
   * Bao gồm: asset, room, components, software, repair summary
   * 
   * @param id - UUID của máy tính hoặc Asset ID
   * @returns Thông tin chi tiết đầy đủ của máy tính
   * @throws NotFoundException nếu không tìm thấy máy tính
   */
  async getComputerDetail(id: string): Promise<GetComputerDetailResponseDto> {
    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException(`ID không hợp lệ: ${id}`);
    }

    // Query computer với tất cả relations cần thiết
    let computer = await this.computerRepository
      .createQueryBuilder('computer')
      .leftJoinAndSelect('computer.asset', 'asset')
      .leftJoinAndSelect('asset.category', 'category')
      .leftJoinAndSelect('computer.room', 'room')
      .leftJoinAndSelect('room.unit', 'unit')
      .leftJoinAndSelect('computer.components', 'component')
      .leftJoinAndSelect('computer.software', 'computerSoftware')
      .leftJoinAndSelect('computerSoftware.software', 'software')
      .where('computer.id = :id', { id })
      .orderBy('component.componentType', 'ASC')
      .addOrderBy('component.installedAt', 'DESC')
      .addOrderBy('computerSoftware.installationDate', 'DESC')
      .getOne();

    // Nếu không tìm thấy bằng computer.id, thử tìm bằng assetId
    if (!computer) {
      computer = await this.computerRepository
        .createQueryBuilder('computer')
        .leftJoinAndSelect('computer.asset', 'asset')
        .leftJoinAndSelect('asset.category', 'category')
        .leftJoinAndSelect('computer.room', 'room')
        .leftJoinAndSelect('room.unit', 'unit')
        .leftJoinAndSelect('computer.components', 'component')
        .leftJoinAndSelect('computer.software', 'computerSoftware')
        .leftJoinAndSelect('computerSoftware.software', 'software')
        .where('computer.assetId = :id', { id })
        .orderBy('component.componentType', 'ASC')
        .addOrderBy('component.installedAt', 'DESC')
        .addOrderBy('computerSoftware.installationDate', 'DESC')
        .getOne();
    }

    // Kiểm tra máy tính có tồn tại không
    if (!computer) {
      throw new NotFoundException(`Không tìm thấy máy tính với ID: ${id}`);
    }

    // Lấy thống kê repair requests của asset này
    const repairRequests = await this.repairRequestRepository
      .createQueryBuilder('repair')
      .where('repair.computerAssetId = :assetId', { assetId: computer.asset.id })
      .select([
        'repair.id',
        'repair.status',
        'repair.createdAt',
      ])
      .getMany();

    // Tính toán repair summary
    const repairSummary = {
      total: repairRequests.length,
      inProgress: repairRequests.filter(r => 
        [RepairStatus.ĐÃ_TIẾP_NHẬN, RepairStatus.ĐANG_XỬ_LÝ].includes(r.status as RepairStatus)
      ).length,
      completed: repairRequests.filter(r => 
        r.status === RepairStatus.ĐÃ_HOÀN_THÀNH
      ).length,
      lastRequestDate: repairRequests.length > 0 
        ? repairRequests.sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )[0].createdAt.toISOString()
        : undefined,
    };

    // Transform components data
    const components = computer.components?.map(comp => ({
      id: comp.id,
      componentType: comp.componentType,
      name: comp.name,
      componentSpecs: comp.componentSpecs,
      serialNumber: comp.serialNumber,
      status: comp.status,
      installedAt: comp.installedAt?.toISOString(),
      removedAt: comp.removedAt?.toISOString(),
      notes: comp.notes,
    })) || [];

    // Transform software data
    const software = computer.software?.map(cs => ({
      id: cs.software.id,
      computerSoftwareId: cs.id,
      name: cs.software.name,
      version: cs.software.version,
      publisher: cs.software.publisher,
      licenseKey: cs.licenseKey,
      installationDate: cs.installationDate ? 
        (typeof cs.installationDate === 'string' 
          ? cs.installationDate 
          : new Date(cs.installationDate).toISOString().split('T')[0]
        ) : undefined,
      notes: cs.notes,
    })) || [];

    // Build response
    return {
      success: true,
      message: 'Lấy thông tin chi tiết máy tính thành công',
      data: {
        id: computer.id,
        machineLabel: computer.machineLabel,
        notes: computer.notes,
        asset: {
          id: computer.asset.id,
          ktCode: computer.asset.ktCode,
          fixedCode: computer.asset.fixedCode,
          name: computer.asset.name,
          specs: computer.asset.specs,
          status: computer.asset.status,
          entrydate: computer.asset.entrydate ? 
            (typeof computer.asset.entrydate === 'string' 
              ? computer.asset.entrydate 
              : new Date(computer.asset.entrydate).toISOString().split('T')[0]
            ) : '',
          origin: computer.asset.origin,
          categoryId: computer.asset.categoryId,
          categoryName: computer.asset.category?.name,
          unit: computer.asset.unit,
          quantity: computer.asset.quantity,
          type: computer.asset.type,
          shape: computer.asset.shape,
        },
        room: computer.room ? {
          id: computer.room.id,
          name: computer.room.name,
          roomNumber: computer.room.roomNumber,
          roomCode: computer.room.roomCode,
          building: computer.room.building,
          floor: computer.room.floor,
          unitId: computer.room.unitId,
          unitName: computer.room.unit?.name,
        } : undefined,
        components,
        componentCount: components.length,
        software,
        softwareCount: software.length,
        repairSummary,
      },
    };
  }
}
