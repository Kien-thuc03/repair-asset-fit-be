import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateComputerDto } from "./dto/create-computer.dto";
import { UpdateComputerDto } from "./dto/update-computer.dto";
import { AvailableComponentsFilterDto } from "./dto/available-components-filter.dto";
import { Computer } from "../../entities/computer.entity";
import { ComputerComponent } from "../../entities/computer-component.entity";
import { RepairRequest } from "../../entities/repair-request.entity";
import { User } from "../../entities/user.entity";
import { RepairStatus } from "../../common/shared/RepairStatus";

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
        "r.floor as floor",
        'c."machineLabel" as machineLabel',
      ])
      .where("cc.id IS NOT NULL") // Only get repair requests with components
      .andWhere('rr."assignedTechnicianId" = :technicianId', {
        technicianId: currentUser.id,
      }) // Chỉ lấy yêu cầu được phân công cho kỹ thuật viên hiện tại
      .andWhere("rr.status IN (:...defaultStatuses)", {
        // Luôn lấy các yêu cầu đang xử lý (không phụ thuộc filter)
        defaultStatuses: [
          RepairStatus.ĐÃ_TIẾP_NHẬN,
          RepairStatus.ĐANG_XỬ_LÝ,
        ],
      });

    // Filter by request code (YCSC)
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

    // Filter by floor
    if (floor) {
      queryBuilder.andWhere("r.floor = :floor", { floor });
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
    const data = rawResults.map((row) => ({
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
      floor: row.floor,
      machineLabel: row.machinelabel,
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
}
