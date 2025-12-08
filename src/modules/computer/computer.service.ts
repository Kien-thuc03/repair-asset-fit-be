import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, SelectQueryBuilder, DataSource, In } from "typeorm";
import { CreateComputerDto } from "./dto/create-computer.dto";
import { UpdateComputerDto } from "./dto/update-computer.dto";
import { AvailableComponentsFilterDto } from "./dto/available-components-filter.dto";
import { GetComputersFilterDto } from "./dto/get-computers-filter.dto";
import { GetComputerDetailResponseDto } from "./dto/get-computer-detail-response.dto";
import {
  ReplaceComponentDto,
  ReplaceMultipleComponentsDto,
} from "./dto/replace-component.dto";
import { AddStockFromProposalDto } from "./dto/add-stock-from-proposal.dto";
import { Computer } from "../../entities/computer.entity";
import { ComputerComponent } from "../../entities/computer-component.entity";
import { RepairRequest } from "../../entities/repair-request.entity";
import { ReplacementItem } from "../../entities/replacement-item.entity";
import { User } from "../../entities/user.entity";
import { RepairStatus } from "../../common/shared/RepairStatus";
import { ComponentStatus } from "../../common/shared/ComponentStatus";
import { AssetStatus } from "../../common/shared/AssetStatus";
import * as QRCode from "qrcode";

@Injectable()
export class ComputerService {
  constructor(
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>,
    @InjectRepository(ComputerComponent)
    private readonly componentRepository: Repository<ComputerComponent>,
    @InjectRepository(RepairRequest)
    private readonly repairRequestRepository: Repository<RepairRequest>,
    @InjectRepository(ReplacementItem)
    private readonly replacementItemRepository: Repository<ReplacementItem>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Tính priority của repair request để ưu tiên hiển thị
   * Priority càng thấp càng ưu tiên: CHỜ_THAY_THẾ (1) > active khác (2) > completed (3)
   * @param status - Status của repair request
   * @returns Priority number (1 = cao nhất, 3 = thấp nhất)
   */
  private getRepairRequestPriority(status: string | null): number {
    if (!status) return 999; // Không có repair request
    
    if (status === RepairStatus.CHỜ_THAY_THẾ) {
      return 1; // Ưu tiên cao nhất
    }
    
    if (
      status !== RepairStatus.ĐÃ_HOÀN_THÀNH &&
      status !== RepairStatus.ĐÃ_HỦY
    ) {
      return 2; // Active status khác
    }
    
    return 3; // Completed hoặc cancelled
  }

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
   * Lấy thông tin chi tiết một component theo ID
   * Trả về thông tin component và computer chứa component đó
   *
   * @param componentId - UUID của component
   * @returns Thông tin component và computer
   * @throws NotFoundException nếu không tìm thấy component
   */
  async getComponentById(componentId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(componentId)) {
      throw new NotFoundException(`ID component không hợp lệ: ${componentId}`);
    }

    // Tìm component
    const component = await this.componentRepository.findOne({
      where: { id: componentId },
    });

    if (!component) {
      throw new NotFoundException(
        `Không tìm thấy component với ID: ${componentId}`
      );
    }

    // Lấy thông tin computer chứa component này
    const computer = await this.computerRepository.findOne({
      where: { id: component.computerAssetId },
      relations: ["asset", "room"],
    });

    return {
      success: true,
      message: "Lấy thông tin component thành công",
      data: {
        component: {
          id: component.id,
          componentType: component.componentType,
          name: component.name,
          componentSpecs: component.componentSpecs,
          serialNumber: component.serialNumber,
          status: component.status,
          installedAt: component.installedAt?.toISOString(),
          removedAt: component.removedAt?.toISOString(),
          notes: component.notes,
        },
        computer: computer
          ? {
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
            }
          : null,
      },
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

    console.log(
      `🔍 [getAvailableComponents] User: ${currentUser.fullName}, Filter:`,
      {
        requestCode,
        componentType,
        search,
        building,
        floor,
        roomName,
        excludeInProposal,
        page,
        limit,
      }
    );

    // ✅ THAY ĐỔI: Query trực tiếp từ computer_components thay vì từ repair_requests
    // Lấy TẤT CẢ FAULTY components, không giới hạn theo repair requests
    // Relationships: computer_components.computerAssetId → computers.id → assets.id → rooms.id
    const queryBuilder = this.componentRepository
      .createQueryBuilder("cc")
      .leftJoin("computers", "c", 'c.id = cc."computerAssetId"') // ✅ Join với computers.id
      .leftJoin("assets", "a", 'a.id = c."assetId"') // ✅ Join assets qua computers.assetId
      .leftJoin("rooms", "r", "r.id = a.current_room_id") // ✅ Join rooms qua assets.current_room_id
      // Left join với repair_requests để lấy thông tin (nếu có)
      // ✅ Lưu ý: Một component có thể có nhiều repair requests, sẽ xử lý sau để lấy ưu tiên nhất
      .leftJoin("repair_request_components", "rrc", 'rrc."componentId" = cc.id')
      .leftJoin(
        "repair_requests",
        "rr",
        'rr.id = rrc."repairRequestId"'
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
        "a.kt_code as ktCode",
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
        "(cc.name ILIKE :search OR a.name ILIKE :search OR a.kt_code ILIKE :search)",
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

    // ✅ Loại trừ các components có TẤT CẢ repair requests đã hoàn thành hoặc đã hủy
    // Component được hiển thị nếu:
    // - Không có repair request nào, HOẶC
    // - Có ít nhất một repair request đang active (chưa hoàn thành/hủy)
    // Component bị loại trừ nếu:
    // - Có repair request VÀ tất cả đều đã hoàn thành/hủy
    // Logic: Giữ lại nếu (có active repair request HOẶC không có completed repair request)
    queryBuilder.andWhere(
      `(
        EXISTS (
          SELECT 1 
          FROM repair_request_components rrc_active
          INNER JOIN repair_requests rr_active ON rr_active.id = rrc_active."repairRequestId"
          WHERE rrc_active."componentId" = cc.id
          AND rr_active.status NOT IN (:...completedOrCancelledStatuses)
        )
        OR NOT EXISTS (
          SELECT 1 
          FROM repair_request_components rrc_completed
          INNER JOIN repair_requests rr_completed ON rr_completed.id = rrc_completed."repairRequestId"
          WHERE rrc_completed."componentId" = cc.id
          AND rr_completed.status IN (:...completedOrCancelledStatuses)
        )
      )`,
      {
        completedOrCancelledStatuses: [
          RepairStatus.ĐÃ_HOÀN_THÀNH,
          RepairStatus.ĐÃ_HỦY,
        ],
      }
    );

    // Get total count - cần lấy tất cả results để xử lý unique sau đó mới pagination
    // Lưu ý: Không pagination ở query level vì cần xử lý unique trước
    const allRawResults = await queryBuilder.getRawMany();

    // ✅ Lưu ý: Không pagination ở query level vì cần xử lý unique trước
    // Sẽ pagination sau khi xử lý unique components
    const rawResults = await queryBuilder.getRawMany();

    // ✅ Xử lý để chỉ giữ lại repair request ưu tiên nhất cho mỗi component
    // Ưu tiên: CHỜ_THAY_THẾ > các status active khác > completed
    // Group by componentId và chọn repair request có priority cao nhất
    const componentMap = new Map<string, any>();
    
    for (const row of rawResults) {
      const componentId = row.componentid;
      
      // Nếu component chưa có trong map, thêm vào
      if (!componentMap.has(componentId)) {
        componentMap.set(componentId, row);
        continue;
      }
      
      // So sánh priority với row hiện tại trong map
      const existingRow = componentMap.get(componentId);
      const existingPriority = this.getRepairRequestPriority(existingRow.repairstatus);
      const currentPriority = this.getRepairRequestPriority(row.repairstatus);
      
      // Nếu current row có priority cao hơn, thay thế
      if (currentPriority < existingPriority) {
        componentMap.set(componentId, row);
      } else if (currentPriority === existingPriority) {
        // Nếu cùng priority, chọn row có createdAt mới hơn
        const existingDate = existingRow.repaircreatedat 
          ? new Date(existingRow.repaircreatedat).getTime() 
          : 0;
        const currentDate = row.repaircreatedat 
          ? new Date(row.repaircreatedat).getTime() 
          : 0;
        if (currentDate > existingDate) {
          componentMap.set(componentId, row);
        }
      }
    }
    
    // Convert map values to array
    let uniqueResults = Array.from(componentMap.values());

    // ✅ Áp dụng sorting sau khi xử lý unique
    const allowedSortFields = [
      "createdAt",
      "componentName",
      "assetName",
      "requestCode",
    ];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";

    uniqueResults.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case "componentName":
          aValue = a.componentname || "";
          bValue = b.componentname || "";
          break;
        case "assetName":
          aValue = a.assetname || "";
          bValue = b.assetname || "";
          break;
        case "requestCode":
          aValue = a.requestcode || "";
          bValue = b.requestcode || "";
          break;
        case "createdAt":
          aValue = a.repaircreatedat
            ? new Date(a.repaircreatedat).getTime()
            : 0;
          bValue = b.repaircreatedat
            ? new Date(b.repaircreatedat).getTime()
            : 0;
          break;
        default:
          aValue = a.installedat ? new Date(a.installedat).getTime() : 0;
          bValue = b.installedat ? new Date(b.installedat).getTime() : 0;
      }

      if (sortOrder === "ASC") {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    // ✅ Tính total sau khi unique
    const total = uniqueResults.length;

    // ✅ Áp dụng pagination sau khi unique và sort
    const skip = (page - 1) * limit;
    const paginatedResults = uniqueResults.slice(skip, skip + limit);

    // Debug: Log first few components
    if (paginatedResults.length > 0) {
      console.log(
        "📦 Sample components:",
        paginatedResults.slice(0, 3).map((r) => ({
          id: r.componentid,
          name: r.componentname,
          status: r.componentstatus,
          type: r.componenttype,
          assetName: r.assetname,
          requestCode: r.requestcode || "No repair request",
          repairStatus: r.repairstatus,
        }))
      );
    }

    // Map to DTO
    const data = paginatedResults.map((row) => ({
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
      // Thông tin repair request ưu tiên nhất (nullable - có thể không có)
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
        .where("component.computerAssetId IN (:...computerIds)", {
          computerIds,
        })
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
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      throw new NotFoundException(`ID không hợp lệ: ${id}`);
    }

    // Query computer với tất cả relations cần thiết
    let computer = await this.computerRepository
      .createQueryBuilder("computer")
      .leftJoinAndSelect("computer.asset", "asset")
      .leftJoinAndSelect("asset.category", "category")
      .leftJoinAndSelect("computer.room", "room")
      .leftJoinAndSelect("room.unit", "unit")
      .leftJoinAndSelect("computer.components", "component")
      .leftJoinAndSelect("computer.software", "computerSoftware")
      .leftJoinAndSelect("computerSoftware.software", "software")
      .where("computer.id = :id", { id })
      .orderBy("component.componentType", "ASC")
      .addOrderBy("component.installedAt", "DESC")
      .addOrderBy("computerSoftware.installationDate", "DESC")
      .getOne();

    // Nếu không tìm thấy bằng computer.id, thử tìm bằng assetId
    if (!computer) {
      computer = await this.computerRepository
        .createQueryBuilder("computer")
        .leftJoinAndSelect("computer.asset", "asset")
        .leftJoinAndSelect("asset.category", "category")
        .leftJoinAndSelect("computer.room", "room")
        .leftJoinAndSelect("room.unit", "unit")
        .leftJoinAndSelect("computer.components", "component")
        .leftJoinAndSelect("computer.software", "computerSoftware")
        .leftJoinAndSelect("computerSoftware.software", "software")
        .where("computer.assetId = :id", { id })
        .orderBy("component.componentType", "ASC")
        .addOrderBy("component.installedAt", "DESC")
        .addOrderBy("computerSoftware.installationDate", "DESC")
        .getOne();
    }

    // Kiểm tra máy tính có tồn tại không
    if (!computer) {
      throw new NotFoundException(`Không tìm thấy máy tính với ID: ${id}`);
    }

    // Lấy thống kê repair requests của asset này
    const repairRequests = await this.repairRequestRepository
      .createQueryBuilder("repair")
      .where("repair.computerAssetId = :assetId", {
        assetId: computer.asset.id,
      })
      .select(["repair.id", "repair.status", "repair.createdAt"])
      .getMany();

    // Tính toán repair summary
    const repairSummary = {
      total: repairRequests.length,
      inProgress: repairRequests.filter((r) =>
        [RepairStatus.ĐÃ_TIẾP_NHẬN, RepairStatus.ĐANG_XỬ_LÝ].includes(
          r.status as RepairStatus
        )
      ).length,
      completed: repairRequests.filter(
        (r) => r.status === RepairStatus.ĐÃ_HOÀN_THÀNH
      ).length,
      lastRequestDate:
        repairRequests.length > 0
          ? repairRequests
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime()
              )[0]
              .createdAt.toISOString()
          : undefined,
    };

    // Transform components data
    const components =
      computer.components?.map((comp) => ({
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
    const software =
      computer.software?.map((cs) => ({
        id: cs.software.id,
        computerSoftwareId: cs.id,
        name: cs.software.name,
        version: cs.software.version,
        publisher: cs.software.publisher,
        licenseKey: cs.licenseKey,
        installationDate: cs.installationDate
          ? typeof cs.installationDate === "string"
            ? cs.installationDate
            : new Date(cs.installationDate).toISOString().split("T")[0]
          : undefined,
        notes: cs.notes,
      })) || [];

    // Build response
    return {
      success: true,
      message: "Lấy thông tin chi tiết máy tính thành công",
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
          entrydate: computer.asset.entrydate
            ? typeof computer.asset.entrydate === "string"
              ? computer.asset.entrydate
              : new Date(computer.asset.entrydate).toISOString().split("T")[0]
            : "",
          origin: computer.asset.origin,
          categoryId: computer.asset.categoryId,
          categoryName: computer.asset.category?.name,
          unit: computer.asset.unit,
          quantity: computer.asset.quantity,
          type: computer.asset.type,
          shape: computer.asset.shape,
        },
        room: computer.room
          ? {
              id: computer.room.id,
              name: computer.room.name,
              roomNumber: computer.room.roomNumber,
              roomCode: computer.room.roomCode,
              building: computer.room.building,
              floor: computer.room.floor,
              unitId: computer.room.unitId,
              unitName: computer.room.unit?.name,
            }
          : undefined,
        components,
        componentCount: components.length,
        software,
        softwareCount: software.length,
        repairSummary,
      },
    };
  }

  /**
   * Thay thế một linh kiện trong máy tính
   * - Cập nhật status linh kiện cũ thành REMOVED và set removedAt
   * - Thêm linh kiện mới với status INSTALLED
   *
   * @param computerId - UUID của máy tính
   * @param replaceDto - Thông tin thay thế linh kiện
   * @returns Thông tin linh kiện mới đã được thêm vào
   * @throws NotFoundException nếu không tìm thấy máy tính hoặc linh kiện cũ
   * @throws BadRequestException nếu linh kiện cũ không thuộc máy tính này
   */
  async replaceComponent(computerId: string, replaceDto: ReplaceComponentDto) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(computerId)) {
      throw new NotFoundException(`ID máy tính không hợp lệ: ${computerId}`);
    }

    // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
    return await this.dataSource.transaction(async (manager) => {
      // 1. Kiểm tra máy tính có tồn tại không
      const computer = await manager.findOne(Computer, {
        where: { id: computerId },
        relations: ["asset", "room"],
      });

      if (!computer) {
        throw new NotFoundException(
          `Không tìm thấy máy tính với ID: ${computerId}`
        );
      }

      // 2. Kiểm tra linh kiện cũ có tồn tại không
      const oldComponent = await manager.findOne(ComputerComponent, {
        where: { id: replaceDto.oldComponentId },
      });

      if (!oldComponent) {
        throw new NotFoundException(
          `Không tìm thấy linh kiện với ID: ${replaceDto.oldComponentId}`
        );
      }

      // 3. Kiểm tra linh kiện cũ có thuộc máy tính này không
      if (oldComponent.computerAssetId !== computerId) {
        throw new BadRequestException(
          `Linh kiện ${oldComponent.name} không thuộc máy tính ${computer.machineLabel}`
        );
      }

      // 4. Cập nhật status linh kiện cũ thành REMOVED
      oldComponent.status = ComponentStatus.REMOVED;
      oldComponent.removedAt = new Date();
      await manager.save(ComputerComponent, oldComponent);

      // 5. Xử lý linh kiện mới
      let savedComponent: ComputerComponent;

      if (replaceDto.newlyPurchasedComponentId) {
        // Nếu có ID linh kiện mới đã được mua sắm, cập nhật trạng thái từ IN_STOCK → INSTALLED
        const existingNewComponent = await manager.findOne(ComputerComponent, {
          where: { id: replaceDto.newlyPurchasedComponentId },
        });

        if (!existingNewComponent) {
          throw new NotFoundException(
            `Không tìm thấy linh kiện mới với ID: ${replaceDto.newlyPurchasedComponentId}`
          );
        }

        // Kiểm tra linh kiện mới có đang ở trạng thái IN_STOCK không
        if (existingNewComponent.status !== ComponentStatus.IN_STOCK) {
          throw new BadRequestException(
            `Linh kiện mới phải ở trạng thái IN_STOCK, hiện tại là: ${existingNewComponent.status}`
          );
        }

        // Cập nhật thông tin linh kiện mới
        existingNewComponent.computerAssetId = computerId;
        existingNewComponent.status = ComponentStatus.INSTALLED;
        existingNewComponent.installedAt = new Date();
        if (replaceDto.serialNumber) {
          existingNewComponent.serialNumber = replaceDto.serialNumber;
        }
        if (replaceDto.notes) {
          existingNewComponent.notes = replaceDto.notes;
        }
        // Cập nhật tên và thông số nếu có thay đổi
        if (replaceDto.newItemName) {
          existingNewComponent.name = replaceDto.newItemName;
        }
        if (replaceDto.newItemSpecs) {
          existingNewComponent.componentSpecs = replaceDto.newItemSpecs;
        }

        savedComponent = await manager.save(
          ComputerComponent,
          existingNewComponent
        );
      } else {
        // Nếu không có ID linh kiện mới, tạo mới linh kiện với status INSTALLED
        const newComponent = manager.create(ComputerComponent, {
          computerAssetId: computerId,
          componentType: oldComponent.componentType, // Giữ nguyên loại linh kiện
          name: replaceDto.newItemName,
          componentSpecs: replaceDto.newItemSpecs,
          serialNumber: replaceDto.serialNumber || null,
          status: ComponentStatus.INSTALLED,
          installedAt: new Date(),
          notes:
            replaceDto.notes || `Thay thế cho linh kiện ${oldComponent.name}`,
        });

        savedComponent = await manager.save(
          ComputerComponent,
          newComponent
        );
      }

      // 6. Trả về thông tin chi tiết
      return {
        success: true,
        message: `Thay thế linh kiện ${oldComponent.componentType} thành công`,
        data: {
          computer: {
            id: computer.id,
            machineLabel: computer.machineLabel,
            assetName: computer.asset?.name,
          },
          oldComponent: {
            id: oldComponent.id,
            name: oldComponent.name,
            componentType: oldComponent.componentType,
            componentSpecs: oldComponent.componentSpecs,
            status: oldComponent.status,
            removedAt: oldComponent.removedAt,
          },
          newComponent: {
            id: savedComponent.id,
            name: savedComponent.name,
            componentType: savedComponent.componentType,
            componentSpecs: savedComponent.componentSpecs,
            serialNumber: savedComponent.serialNumber,
            status: savedComponent.status,
            installedAt: savedComponent.installedAt,
            notes: savedComponent.notes,
          },
        },
      };
    });
  }

  /**
   * Thêm linh kiện mới về kho từ đề xuất thay thế (Bulk Action)
   * Xử lý tất cả các items trong đề xuất cùng lúc
   *
   * @param dto - Chứa proposalId và notes
   * @returns Kết quả xử lý từng item
   */
  async addStockFromProposal(dto: AddStockFromProposalDto) {
    const { proposalId, notes } = dto;

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(proposalId)) {
      throw new NotFoundException(`ID đề xuất không hợp lệ: ${proposalId}`);
    }

    // Sử dụng transaction để đảm bảo tính nhất quán dữ liệu
    return await this.dataSource.transaction(async (manager) => {
      // 1. Lấy tất cả items của đề xuất
      const items = await manager.find(ReplacementItem, {
        where: { proposalId },
        relations: ["oldComponent", "proposal"],
      });

      if (!items || items.length === 0) {
        throw new NotFoundException(
          `Không tìm thấy mục thay thế nào cho đề xuất: ${proposalId}`
        );
      }

      const results = [];
      let successCount = 0;

      for (const item of items) {
        // Skip nếu đã có linh kiện mới
        if (item.newlyPurchasedComponentId) {
          results.push({
            itemId: item.id,
            status: "SKIPPED",
            message: "Đã có linh kiện mới",
            componentId: item.newlyPurchasedComponentId,
          });
          continue;
        }

        // Skip nếu không có thông tin linh kiện cũ (trường hợp mua mới hoàn toàn?)
        // Với đề xuất thay thế thì bắt buộc phải có oldComponent
        if (!item.oldComponent) {
          results.push({
            itemId: item.id,
            status: "ERROR",
            message: "Không tìm thấy thông tin linh kiện cũ",
          });
          continue;
        }

        const oldComp = item.oldComponent;

        // Validate status linh kiện cũ
        if (
          oldComp.status !== ComponentStatus.FAULTY &&
          oldComp.status !== ComponentStatus.PENDING_REPLACEMENT
        ) {
          results.push({
            itemId: item.id,
            status: "ERROR",
            message: `Linh kiện cũ ${oldComp.name} có status không hợp lệ: ${oldComp.status}`,
          });
          continue;
        }

        // Xử lý linh kiện mới
        let savedComponent: ComputerComponent;

        if (item.newlyPurchasedComponentId) {
          // Nếu có ID linh kiện mới đã được mua sắm, cập nhật trạng thái từ IN_STOCK → INSTALLED
          const existingNewComponent = await manager.findOne(ComputerComponent, {
            where: { id: item.newlyPurchasedComponentId },
          });

          if (!existingNewComponent) {
            throw new NotFoundException(
              `Không tìm thấy linh kiện mới với ID: ${item.newlyPurchasedComponentId}`
            );
          }

          // Kiểm tra linh kiện mới có đang ở trạng thái IN_STOCK không
          if (existingNewComponent.status !== ComponentStatus.IN_STOCK) {
            throw new BadRequestException(
              `Linh kiện mới phải ở trạng thái IN_STOCK, hiện tại là: ${existingNewComponent.status}`
            );
          }

          // Cập nhật thông tin linh kiện mới
          existingNewComponent.computerAssetId = oldComp.computerAssetId;
          existingNewComponent.status = ComponentStatus.INSTALLED;
          existingNewComponent.installedAt = new Date();
          if (notes) {
            existingNewComponent.notes = notes;
          }
          // Cập nhật tên và thông số nếu có thay đổi
          if (item.newItemName) {
            existingNewComponent.name = item.newItemName;
          }
          if (item.newItemSpecs) {
            existingNewComponent.componentSpecs = item.newItemSpecs;
          }

          savedComponent = await manager.save(
            ComputerComponent,
            existingNewComponent
          );
        } else {
          // Nếu không có ID linh kiện mới, tạo mới linh kiện với status INSTALLED
          const newComponent = manager.create(ComputerComponent, {
            computerAssetId: oldComp.computerAssetId,
            componentType: oldComp.componentType,
            name: item.newItemName,
            componentSpecs: item.newItemSpecs,
            serialNumber: null,
            status: ComponentStatus.INSTALLED,
            installedAt: new Date(),
            notes:
              notes || `Thay thế cho linh kiện ${oldComp.name}`,
          });

          savedComponent = await manager.save(
            ComputerComponent,
            newComponent
          );
        }

        // Cập nhật item
        item.newlyPurchasedComponentId = savedComponent.id;
        await manager.save(ReplacementItem, item);

        successCount++;
        results.push({
          itemId: item.id,
          status: "SUCCESS",
          newComponent: {
            id: savedComponent.id,
            name: savedComponent.name,
            type: savedComponent.componentType,
          },
        });
      }

      return {
        success: true,
        message: `Đã xử lý nhập kho cho đề xuất. Thành công: ${successCount}/${items.length}`,
        data: {
          proposalId,
          totalItems: items.length,
          successCount,
          details: results,
        },
      };
    });
  }

  /**
   * Generate QR code cho computer
   * QR code chứa computerId để người dùng quét và tự động điền thông tin
   *
   * @param computerId - UUID của máy tính
   * @returns Base64 string của QR code image
   * @throws NotFoundException nếu không tìm thấy máy tính
   */
  async generateQRCode(computerId: string): Promise<string> {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(computerId)) {
      throw new NotFoundException(`ID máy tính không hợp lệ: ${computerId}`);
    }

    // Kiểm tra máy tính có tồn tại không
    const computer = await this.computerRepository.findOne({
      where: { id: computerId },
      relations: ["asset", "room"],
    });

    if (!computer) {
      throw new NotFoundException(
        `Không tìm thấy máy tính với ID: ${computerId}`
      );
    }

    try {
      // Tạo data object để encode vào QR
      const qrData = {
        type: "REPAIR_REQUEST",
        computerId: computer.id,
        timestamp: new Date().toISOString(),
      };

      // Generate QR code dưới dạng base64 string
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        errorCorrectionLevel: "H",
        type: "image/png",
        width: 300,
        margin: 1,
      });

      return qrCodeDataURL;
    } catch (error) {
      console.error("Error generating QR code:", error);
      throw new BadRequestException("Không thể tạo QR code");
    }
  }

  /**
   * Lấy thông tin máy tính để tạo repair request từ QR code
   * Trả về tất cả thông tin cần thiết để auto-fill form
   *
   * @param computerId - UUID của máy tính
   * @returns Thông tin máy tính và components để tạo repair request
   * @throws NotFoundException nếu không tìm thấy máy tính
   */
  async getComputerRepairInfo(computerId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(computerId)) {
      throw new NotFoundException(`ID máy tính không hợp lệ: ${computerId}`);
    }

    // Lấy thông tin máy tính đầy đủ
    const computer = await this.computerRepository.findOne({
      where: { id: computerId },
      relations: [
        "asset",
        "asset.category",
        "room",
        "room.unit",
        "components",
        "software",
        "software.software",
      ],
    });

    if (!computer) {
      throw new NotFoundException(
        `Không tìm thấy máy tính với ID: ${computerId}`
      );
    }

    // Kiểm tra máy tính có đang được sửa chữa không
    const activeRepairRequest = await this.repairRequestRepository.findOne({
      where: {
        computerAssetId: computer.assetId,
        status: In([
          RepairStatus.CHỜ_TIẾP_NHẬN,
          RepairStatus.ĐÃ_TIẾP_NHẬN,
          RepairStatus.ĐANG_XỬ_LÝ,
          RepairStatus.CHỜ_THAY_THẾ,
        ]),
      },
      order: { createdAt: "DESC" },
    });

    // Lấy danh sách components có thể báo lỗi (status = INSTALLED)
    const availableComponents =
      computer.components
        ?.filter((c) => c.status === ComponentStatus.INSTALLED)
        .map((c) => ({
          id: c.id,
          componentType: c.componentType,
          name: c.name,
          componentSpecs: c.componentSpecs,
          serialNumber: c.serialNumber,
        })) || [];

    // Lấy danh sách software đã cài đặt
    const installedSoftware =
      computer.software?.map((cs) => ({
        id: cs.software.id,
        name: cs.software.name,
        version: cs.software.version,
        publisher: cs.software.publisher,
        installationDate: cs.installationDate,
      })) || [];

    return {
      success: true,
      message: "Lấy thông tin máy tính thành công",
      data: {
        computer: {
          id: computer.id,
          machineLabel: computer.machineLabel,
          notes: computer.notes,
        },
        asset: {
          id: computer.asset.id,
          ktCode: computer.asset.ktCode,
          fixedCode: computer.asset.fixedCode,
          name: computer.asset.name,
          specs: computer.asset.specs,
          status: computer.asset.status,
          categoryName: computer.asset.category?.name,
        },
        room: computer.room
          ? {
              id: computer.room.id,
              name: computer.room.name,
              roomNumber: computer.room.roomNumber,
              roomCode: computer.room.roomCode,
              building: computer.room.building,
              floor: computer.room.floor,
              unitName: computer.room.unit?.name,
            }
          : null,
        availableComponents,
        installedSoftware,
        hasActiveRepair: !!activeRepairRequest,
        activeRepairInfo: activeRepairRequest
          ? {
              id: activeRepairRequest.id,
              requestCode: activeRepairRequest.requestCode,
              status: activeRepairRequest.status,
              description: activeRepairRequest.description,
              createdAt: activeRepairRequest.createdAt,
            }
          : null,
      },
    };
  }

  /**
   * Xóa một linh kiện khỏi hệ thống
   * Kiểm tra ràng buộc trước khi xóa (repair requests, replacement items)
   *
   * @param componentId - UUID của linh kiện cần xóa
   * @returns Thông tin linh kiện đã xóa
   * @throws NotFoundException nếu không tìm thấy linh kiện
   * @throws BadRequestException nếu linh kiện đang được sử dụng
   */
  async deleteComponent(componentId: string) {
    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(componentId)) {
      throw new NotFoundException(`ID linh kiện không hợp lệ: ${componentId}`);
    }

    // 1. Kiểm tra linh kiện có tồn tại không
    const component = await this.componentRepository.findOne({
      where: { id: componentId },
      relations: ["computer", "computer.asset"],
    });

    if (!component) {
      throw new NotFoundException(
        `Không tìm thấy linh kiện với ID: ${componentId}`
      );
    }

    // 2. Kiểm tra linh kiện có đang được sử dụng trong repair requests không
    const repairRequestCount = await this.repairRequestRepository
      .createQueryBuilder("repair")
      .innerJoin(
        "repair_request_components",
        "rrc",
        'rrc."repairRequestId" = repair.id'
      )
      .where('rrc."componentId" = :componentId', { componentId })
      .getCount();

    if (repairRequestCount > 0) {
      throw new BadRequestException(
        `Không thể xóa linh kiện này vì đang được sử dụng trong ${repairRequestCount} yêu cầu sửa chữa. Vui lòng xóa hoặc cập nhật các yêu cầu sửa chữa liên quan trước.`
      );
    }

    // 3. Kiểm tra linh kiện có đang được sử dụng trong replacement items không
    const replacementItemCount = await this.replacementItemRepository
      .createQueryBuilder("item")
      .where("item.oldComponentId = :componentId", { componentId })
      .orWhere("item.newlyPurchasedComponentId = :componentId", {
        componentId,
      })
      .getCount();

    if (replacementItemCount > 0) {
      throw new BadRequestException(
        `Không thể xóa linh kiện này vì đang được sử dụng trong ${replacementItemCount} đề xuất thay thế. Vui lòng xóa hoặc cập nhật các đề xuất liên quan trước.`
      );
    }

    // 4. Lưu thông tin linh kiện trước khi xóa để trả về
    const componentInfo = {
      id: component.id,
      name: component.name,
      componentType: component.componentType,
      componentSpecs: component.componentSpecs,
      serialNumber: component.serialNumber,
      status: component.status,
      computer: component.computer
        ? {
            id: component.computer.id,
            machineLabel: component.computer.machineLabel,
            assetName: component.computer.asset?.name,
          }
        : null,
    };

    // 5. Xóa linh kiện
    await this.componentRepository.remove(component);

    // 6. Trả về thông tin đã xóa
    return {
      success: true,
      message: `Xóa linh kiện ${component.name} thành công`,
      data: {
        deletedComponent: componentInfo,
      },
    };
  }
}
