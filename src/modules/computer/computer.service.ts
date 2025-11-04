import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CreateComputerDto } from "./dto/create-computer.dto";
import { UpdateComputerDto } from "./dto/update-computer.dto";
import { Computer } from "../../entities/computer.entity";
import { ComputerComponent } from "../../entities/computer-component.entity";

@Injectable()
export class ComputerService {
  constructor(
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>,
    @InjectRepository(ComputerComponent)
    private readonly componentRepository: Repository<ComputerComponent>
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
}
