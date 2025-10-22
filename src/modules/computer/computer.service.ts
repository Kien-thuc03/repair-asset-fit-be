import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateComputerDto } from './dto/create-computer.dto';
import { UpdateComputerDto } from './dto/update-computer.dto';
import { Computer } from '../../entities/computer.entity';
import { ComputerComponent } from '../../entities/computer-component.entity';

@Injectable()
export class ComputerService {
  constructor(
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>,
    @InjectRepository(ComputerComponent)
    private readonly componentRepository: Repository<ComputerComponent>,
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(roomId)) {
      throw new NotFoundException(`ID phòng không hợp lệ: ${roomId}`);
    }

    // Query computers with relations using QueryBuilder for better control
    const computers = await this.computerRepository
      .createQueryBuilder('computer')
      .leftJoinAndSelect('computer.asset', 'asset')
      .leftJoinAndSelect('computer.room', 'room')
      .leftJoinAndSelect('computer.components', 'component')
      .where('computer.roomId = :roomId', { roomId })
      .orderBy('computer.machineLabel', 'ASC')
      .addOrderBy('component.componentType', 'ASC')
      .getMany();

    // Kiểm tra nếu không có máy tính nào trong phòng
    if (!computers || computers.length === 0) {
      throw new NotFoundException(
        `Không tìm thấy máy tính nào trong phòng với ID: ${roomId}`,
      );
    }

    // Transform data để trả về thông tin có cấu trúc tốt hơn
    const result = computers.map((computer) => ({
      id: computer.id,
      machineLabel: computer.machineLabel,
      notes: computer.notes,
      asset: computer.asset ? {
        id: computer.asset.id,
        name: computer.asset.name,
        ktCode: computer.asset.ktCode,
        fixedCode: computer.asset.fixedCode,
        status: computer.asset.status,
        specs: computer.asset.specs,
        entrydate: computer.asset.entrydate,
        origin: computer.asset.origin,
      } : null,
      room: computer.room ? {
        id: computer.room.id,
        name: computer.room.name,
        roomCode: computer.room.roomCode,
      } : null,
      components: computer.components?.map((comp) => ({
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
}
