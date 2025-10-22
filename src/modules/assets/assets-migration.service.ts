import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Asset } from 'src/entities/asset.entity';
import { Computer } from 'src/entities/computer.entity';
import { ComputerComponent } from 'src/entities/computer-component.entity';
import { ComponentType } from 'src/common/shared/ComponentType';
import { ComponentStatus } from 'src/common/shared/ComponentStatus';
import { Room } from 'src/entities/room.entity';

/**
 * Service để migrate dữ liệu từ bảng Assets sang Computer và ComputerComponent
 * 
 * Mục đích: Tách thông tin specs trong Asset thành các bản ghi riêng biệt
 * trong Computer và ComputerComponent để quản lý chi tiết hơn
 */
@Injectable()
export class AssetsMigrationService {
  private readonly logger = new Logger(AssetsMigrationService.name);

  constructor(
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>,
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>,
    @InjectRepository(Room)
    private readonly roomRepository: Repository<Room>,
    @InjectRepository(ComputerComponent)
    private readonly componentRepository: Repository<ComputerComponent>,
  ) {}

  /**
   * Parse specs string từ Asset để trích xuất thông tin linh kiện
   * 
   * Ví dụ specs: "Máy tính để bàn Dell Vostro 270MT - Intel Pentium G2020, 2GB RAM, 500GB HDD, VGA Intel HD Graphics, DVDRW, Keybroad + Mouse"
   * 
   * @param specs - Chuỗi specs từ asset
   * @returns Mảng các component được parse
   */
  private parseSpecs(specs: string): Array<{
    componentType: ComponentType;
    name: string;
    componentSpecs: string;
  }> {
    if (!specs) return [];

    const components: Array<{
      componentType: ComponentType;
      name: string;
      componentSpecs: string;
    }> = [];

    const specsLower = specs.toLowerCase();

    // Parse CPU
    const cpuPatterns = [
      /intel\s+(?:core\s+)?([a-z0-9\-]+)/i,
      /amd\s+(?:ryzen\s+)?([a-z0-9\-]+)/i,
      /pentium\s+([a-z0-9\-]+)/i,
      /celeron\s+([a-z0-9\-]+)/i,
    ];

    for (const pattern of cpuPatterns) {
      const match = specs.match(pattern);
      if (match) {
        components.push({
          componentType: ComponentType.CPU,
          name: match[0].trim(),
          componentSpecs: match[0].trim(),
        });
        break;
      }
    }

    // Parse RAM
    const ramMatch = specs.match(/(\d+)\s*gb\s+ram/i);
    if (ramMatch) {
      components.push({
        componentType: ComponentType.RAM,
        name: `RAM ${ramMatch[1]}GB`,
        componentSpecs: `${ramMatch[1]}GB`,
      });
    }

    // Parse Storage (HDD/SSD)
    const storagePatterns = [
      /(\d+)\s*gb\s+(?:hdd|ssd)/i,
      /(\d+)\s*tb\s+(?:hdd|ssd)/i,
    ];

    for (const pattern of storagePatterns) {
      const match = specs.match(pattern);
      if (match) {
        components.push({
          componentType: ComponentType.STORAGE,
          name: match[0].trim(),
          componentSpecs: match[0].trim(),
        });
        break;
      }
    }

    // Parse GPU
    const gpuPatterns = [
      /vga\s+([^,]+)/i,
      /nvidia\s+([^,]+)/i,
      /amd\s+radeon\s+([^,]+)/i,
      /intel\s+(?:hd|uhd|iris)\s+graphics\s*(\d*)/i,
    ];

    for (const pattern of gpuPatterns) {
      const match = specs.match(pattern);
      if (match) {
        components.push({
          componentType: ComponentType.GPU,
          name: match[0].trim(),
          componentSpecs: match[0].trim(),
        });
        break;
      }
    }

    // Parse Monitor (nếu có từ khóa monitor/màn hình)
    if (specsLower.includes('monitor') || specsLower.includes('màn hình')) {
      const monitorMatch = specs.match(/(?:monitor|màn\s*hình)\s*([^,]+)/i);
      if (monitorMatch) {
        components.push({
          componentType: ComponentType.MONITOR,
          name: monitorMatch[0].trim(),
          componentSpecs: monitorMatch[0].trim(),
        });
      }
    }

    // Parse Keyboard
    if (specsLower.includes('keyboard') || specsLower.includes('keybroad') || specsLower.includes('bàn phím')) {
      components.push({
        componentType: ComponentType.KEYBOARD,
        name: 'Keyboard',
        componentSpecs: 'Standard Keyboard',
      });
    }

    // Parse Mouse
    if (specsLower.includes('mouse') || specsLower.includes('chuột')) {
      components.push({
        componentType: ComponentType.MOUSE,
        name: 'Mouse',
        componentSpecs: 'Standard Mouse',
      });
    }

    // Parse Optical Drive
    if (specsLower.includes('dvdrw') || specsLower.includes('dvd') || specsLower.includes('cd-rom')) {
      const driveMatch = specs.match(/(dvdrw|dvd-rw|cd-rom)/i);
      components.push({
        componentType: ComponentType.OPTICAL_DRIVE,
        name: driveMatch ? driveMatch[0].toUpperCase() : 'DVDRW',
        componentSpecs: driveMatch ? driveMatch[0].toUpperCase() : 'DVDRW',
      });
    }

    return components;
  }

  /**
   * Generate machine label từ room và số thứ tự
   * @param building - Tên tòa nhà
   * @param floor - Tầng của phòng
   * @param roomNumber - Tên phòng
   * @param roomCount - Số máy đang có trong phòng
   * @returns Machine label (ví dụ: "H301M11")
   */
  private async generateMachineLabel(roomId: string): Promise<string> {
    const room = await this.roomRepository.findOne({ where: { id: roomId } });
    if (!room) {
      this.logger.warn(`Không tìm thấy phòng với ID ${roomId}`);
      return `PC-00`;
    }

    const roomCount = await this.computerRepository.count({ where: { roomId } });
    return `${room.building}${room.floor}${room.roomNumber}M${String(roomCount + 1).padStart(2, '0')}`;
  }

  /**
   * Migrate một asset sang Computer và ComputerComponents
   * 
   * @param asset - Asset cần migrate
   * @param machineIndex - Số thứ tự máy trong phòng
   * @returns Computer đã được tạo
   */
  async migrateAssetToComputer(
    asset: Asset,
    machineIndex: number,
  ): Promise<Computer | null> {
    try {
      // Kiểm tra asset phải có roomId
      if (!asset.currentRoomId) {
        this.logger.warn(
          `Asset ${asset.ktCode} không có room_id, bỏ qua migrate`,
        );
        return null;
      }

      // Kiểm tra đã tồn tại Computer cho asset này chưa
      const existingComputer = await this.computerRepository.findOne({
        where: { assetId: asset.id },
      });

      if (existingComputer) {
        this.logger.warn(
          `Computer đã tồn tại cho asset ${asset.ktCode}, bỏ qua`,
        );
        return existingComputer;
      }

      // Tạo Computer record
      const computer = this.computerRepository.create({
        assetId: asset.id,
        roomId: asset.currentRoomId,
        machineLabel: await this.generateMachineLabel(asset.currentRoomId),
        notes: `Migrated from asset: ${asset.name}`,
      });

      const savedComputer = await this.computerRepository.save(computer);
      this.logger.log(
        `✅ Tạo Computer thành công cho asset ${asset.ktCode} - Machine: ${savedComputer.machineLabel}`,
      );

      // Parse specs và tạo components
      const parsedComponents = this.parseSpecs(asset.specs || '');

      if (parsedComponents.length > 0) {
        const components = parsedComponents.map((comp) =>
          this.componentRepository.create({
            computerAssetId: savedComputer.id,
            componentType: comp.componentType,
            name: comp.name,
            componentSpecs: comp.componentSpecs,
            status: ComponentStatus.INSTALLED,
            installedAt: asset.entrydate || new Date(),
            notes: `Auto-parsed from asset specs`,
          }),
        );

        await this.componentRepository.save(components);
        this.logger.log(
          `✅ Tạo ${components.length} components cho computer ${savedComputer.machineLabel}`,
        );
      } else {
        this.logger.warn(
          `⚠️  Không parse được component nào từ specs của asset ${asset.ktCode}`,
        );
      }

      return savedComputer;
    } catch (error) {
      const err = error as Error;
      this.logger.error(
        `❌ Lỗi khi migrate asset ${asset.ktCode}: ${err.message}`,
        err.stack,
      );
      throw error;
    }
  }

  /**
   * Migrate tất cả assets là máy tính sang Computer và ComputerComponents
   * 
   * @param categoryIds - Mảng ID của categories là máy tính (optional)
   * @returns Kết quả migrate
   */
  async migrateAllComputerAssets(
    categoryIds?: string[],
  ): Promise<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
  }> {
    this.logger.log('🚀 Bắt đầu migrate assets sang computers...');

    const result = {
      total: 0,
      success: 0,
      failed: 0,
      skipped: 0,
    };

    try {
      // Build query để lấy assets là máy tính
      const queryBuilder = this.assetRepository
        .createQueryBuilder('asset')
        .where('asset.deleted_at IS NULL');

      // Nếu có categoryIds, filter theo category
      if (categoryIds && categoryIds.length > 0) {
        queryBuilder.andWhere('asset.category_id IN (:...categoryIds)', {
          categoryIds,
        });
      }

      // Hoặc filter theo tên chứa "máy tính"/"computer"
      else {
        queryBuilder.andWhere(
          '(LOWER(asset.name) LIKE :computer1 OR LOWER(asset.name) LIKE :computer2)',
          {
            computer1: '%máy tính%',
            computer2: '%computer%',
          },
        );
      }

      const assets = await queryBuilder.getMany();
      result.total = assets.length;

      this.logger.log(`📊 Tìm thấy ${assets.length} assets cần migrate`);

      // Group assets theo room để tạo machineLabel sequential
      const assetsByRoom = new Map<string, Asset[]>();
      for (const asset of assets) {
        if (asset.currentRoomId) {
          if (!assetsByRoom.has(asset.currentRoomId)) {
            assetsByRoom.set(asset.currentRoomId, []);
          }
          assetsByRoom.get(asset.currentRoomId)!.push(asset);
        }
      }

      // Migrate từng room
      for (const [roomId, roomAssets] of assetsByRoom.entries()) {
        this.logger.log(
          `\n📍 Processing room ${roomId.slice(-8)} - ${roomAssets.length} assets`,
        );

        for (let i = 0; i < roomAssets.length; i++) {
          const asset = roomAssets[i];
          try {
            const computer = await this.migrateAssetToComputer(asset, i + 1);
            if (computer) {
              result.success++;
            } else {
              result.skipped++;
            }
          } catch (error) {
            result.failed++;
            const err = error as Error;
            this.logger.error(
              `Failed to migrate asset ${asset.ktCode}: ${err.message}`,
            );
          }
        }
      }

      // Assets không có room
      const assetsWithoutRoom = assets.filter((a) => !a.currentRoomId);
      if (assetsWithoutRoom.length > 0) {
        this.logger.warn(
          `⚠️  ${assetsWithoutRoom.length} assets không có room_id, bỏ qua`,
        );
        result.skipped += assetsWithoutRoom.length;
      }

      this.logger.log('\n' + '='.repeat(60));
      this.logger.log('🎉 Migration hoàn tất!');
      this.logger.log(`📊 Tổng số: ${result.total}`);
      this.logger.log(`✅ Thành công: ${result.success}`);
      this.logger.log(`⏭️  Bỏ qua: ${result.skipped}`);
      this.logger.log(`❌ Thất bại: ${result.failed}`);
      this.logger.log('='.repeat(60));

      return result;
    } catch (error) {
      const err = error as Error;
      this.logger.error('❌ Lỗi nghiêm trọng khi migrate:', err.stack);
      throw error;
    }
  }

  /**
   * Rollback - Xóa tất cả Computer và ComputerComponent đã migrate
   * ⚠️ CHÚ Ý: Chỉ dùng trong môi trường development/testing
   */
  async rollbackMigration(): Promise<{
    deletedComputers: number;
    deletedComponents: number;
  }> {
    this.logger.warn('⚠️  BẮT ĐẦU ROLLBACK - XÓA TẤT CẢ DỮ LIỆU MIGRATE');

    // Xóa tất cả components
    const componentsResult = await this.componentRepository
      .createQueryBuilder()
      .delete()
      .from(ComputerComponent)
      .execute();
    const deletedComponents =
      typeof componentsResult.affected === 'number'
        ? componentsResult.affected
        : 0;

    // Xóa tất cả computers
    const computersResult = await this.computerRepository
      .createQueryBuilder()
      .delete()
      .from(Computer)
      .execute();
    const deletedComputers =
      typeof computersResult.affected === 'number'
        ? computersResult.affected
        : 0;

    this.logger.log(`🗑️  Đã xóa ${deletedComputers} computers`);
    this.logger.log(`🗑️  Đã xóa ${deletedComponents} components`);

    return {
      deletedComputers,
      deletedComponents,
    };
  }
}
