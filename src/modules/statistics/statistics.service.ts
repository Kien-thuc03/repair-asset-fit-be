import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource } from "typeorm";
import { RepairRequest } from "../../entities/repair-request.entity";
import { ReplacementProposal } from "../../entities/replacement-proposal.entity";
import { SoftwareProposal } from "../../entities/software-proposal.entity";
import { ReplacementItem } from "../../entities/replacement-item.entity";
import { SoftwareProposalItem } from "../../entities/software-proposal-item.entity";
import { Room } from "../../entities/room.entity";
import { Computer } from "../../entities/computer.entity";
import { ComputerComponent } from "../../entities/computer-component.entity";
import { ComputerSoftware } from "../../entities/computer-software.entity";
import { Software } from "../../entities/software.entity";

@Injectable()
export class StatisticsService {
  constructor(
    @InjectRepository(RepairRequest)
    private repairRequestRepository: Repository<RepairRequest>,
    @InjectRepository(ReplacementProposal)
    private replacementProposalRepository: Repository<ReplacementProposal>,
    @InjectRepository(SoftwareProposal)
    private softwareProposalRepository: Repository<SoftwareProposal>,
    @InjectRepository(ReplacementItem)
    private replacementItemRepository: Repository<ReplacementItem>,
    @InjectRepository(SoftwareProposalItem)
    private softwareProposalItemRepository: Repository<SoftwareProposalItem>,
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Computer)
    private computerRepository: Repository<Computer>,
    @InjectRepository(ComputerComponent)
    private computerComponentRepository: Repository<ComputerComponent>,
    @InjectRepository(ComputerSoftware)
    private computerSoftwareRepository: Repository<ComputerSoftware>,
    @InjectRepository(Software)
    private softwareRepository: Repository<Software>,
    private dataSource: DataSource
  ) {}

  async getStatistics() {
    // 1. Thống kê Repair Requests theo status
    const repairRequests = await this.repairRequestRepository
      .createQueryBuilder("repair")
      .select("repair.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("repair.status")
      .getRawMany();

    // 2. Thống kê Error Types
    const errorTypes = await this.repairRequestRepository
      .createQueryBuilder("repair")
      .select("repair.errorType", "errorType")
      .addSelect("COUNT(*)", "count")
      .where("repair.errorType IS NOT NULL")
      .groupBy("repair.errorType")
      .getRawMany();

    // 3. Thống kê Replacement Proposals theo status
    const replacementProposals = await this.replacementProposalRepository
      .createQueryBuilder("proposal")
      .select("proposal.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("proposal.status")
      .getRawMany();

    // 4. Thống kê chi tiết Replacement Proposals (số lượng proposal và tổng items)
    const replacementProposalDetails = await this.replacementProposalRepository
      .createQueryBuilder("proposal")
      .leftJoin("proposal.items", "item")
      .select("proposal.status", "status")
      .addSelect("COUNT(DISTINCT proposal.id)", "proposalCount")
      .addSelect("COALESCE(SUM(item.quantity), 0)", "totalItems")
      .groupBy("proposal.status")
      .getRawMany();

    // 5. Thống kê Software Proposals theo status
    const softwareProposals = await this.softwareProposalRepository
      .createQueryBuilder("proposal")
      .select("proposal.status", "status")
      .addSelect("COUNT(*)", "count")
      .groupBy("proposal.status")
      .getRawMany();

    // 6. Thống kê chi tiết Software Proposals (số lượng proposal và tổng items)
    const softwareProposalDetails = await this.softwareProposalRepository
      .createQueryBuilder("proposal")
      .leftJoin("proposal.items", "item")
      .select("proposal.status", "status")
      .addSelect("COUNT(DISTINCT proposal.id)", "proposalCount")
      .addSelect("COALESCE(SUM(item.quantity), 0)", "totalItems")
      .groupBy("proposal.status")
      .getRawMany();

    return {
      repairRequests: repairRequests.map((item) => ({
        status: item.status,
        count: parseInt(item.count, 10),
      })),
      errorTypes: errorTypes.map((item) => ({
        errorType: item.errorType,
        count: parseInt(item.count, 10),
      })),
      replacementProposals: replacementProposals.map((item) => ({
        status: item.status,
        count: parseInt(item.count, 10),
      })),
      replacementProposalDetails: replacementProposalDetails.map((item) => ({
        status: item.status,
        proposalCount: parseInt(item.proposalCount, 10),
        totalItems: parseInt(item.totalItems, 10),
      })),
      softwareProposals: softwareProposals.map((item) => ({
        status: item.status,
        count: parseInt(item.count, 10),
      })),
      softwareProposalDetails: softwareProposalDetails.map((item) => ({
        status: item.status,
        proposalCount: parseInt(item.proposalCount, 10),
        totalItems: parseInt(item.totalItems, 10),
      })),
    };
  }

  async getRoomStatistics(filters?: {
    building?: string;
    floor?: string;
    roomId?: string;
  }) {
    // Build query với filters
    const queryBuilder = this.roomRepository.createQueryBuilder("room");

    if (filters?.building) {
      queryBuilder.andWhere("room.building = :building", {
        building: filters.building,
      });
    }

    if (filters?.floor) {
      queryBuilder.andWhere("room.floor = :floor", {
        floor: filters.floor,
      });
    }

    if (filters?.roomId) {
      queryBuilder.andWhere("room.id = :roomId", {
        roomId: filters.roomId,
      });
    }

    // Lấy các phòng theo filter
    const rooms = await queryBuilder.getMany();

    const roomStatistics = await Promise.all(
      rooms.map(async (room) => {
        // Đếm tổng số máy trong phòng
        const totalComputers = await this.computerRepository.count({
          where: { roomId: room.id },
        });

        // Lấy máy tính đầu tiên trong phòng để lấy cấu hình và phần mềm đại diện
        const firstComputer = await this.computerRepository.findOne({
          where: { roomId: room.id },
        });

        if (!firstComputer) {
          return {
            roomId: room.id,
            roomName: room.name,
            roomCode: room.roomCode,
            building: room.building,
            floor: room.floor,
            roomNumber: room.roomNumber,
            totalComputers: 0,
            components: [],
            software: [],
          };
        }

        // Lấy tất cả components của máy đầu tiên (đại diện cho cấu hình của phòng)
        // Lưu ý: computerAssetId trong database trỏ đến computer.id (computerId), không phải computer.assetId
        const components = await this.computerComponentRepository.find({
          where: { computerAssetId: firstComputer.id },
          order: { componentType: "ASC" },
        });

        // Lấy tất cả software của máy đầu tiên (đại diện cho phần mềm của phòng)
        // Sử dụng QueryBuilder để tránh vấn đề với tên column
        const computerSoftwareList = await this.computerSoftwareRepository
          .createQueryBuilder("cs")
          .leftJoinAndSelect("cs.software", "software")
          .where("cs.computerId = :computerId", {
            computerId: firstComputer.id,
          })
          .getMany();

        const software = computerSoftwareList.map((cs) => {
          let installationDateStr: string | undefined = undefined;

          if (cs.installationDate) {
            try {
              const dateValue: any = cs.installationDate;
              if (dateValue instanceof Date) {
                installationDateStr = dateValue.toISOString().split("T")[0];
              } else if (typeof dateValue === "string") {
                const dateStr = dateValue as string;
                installationDateStr = dateStr.split("T")[0].substring(0, 10);
              } else {
                const parsedDate = new Date(dateValue);
                if (!isNaN(parsedDate.getTime())) {
                  installationDateStr = parsedDate.toISOString().split("T")[0];
                }
              }
            } catch (error) {
              installationDateStr = undefined;
            }
          }

          return {
            id: cs.software.id,
            name: cs.software.name,
            version: cs.software.version || undefined,
            publisher: cs.software.publisher || undefined,
            installationDate: installationDateStr,
            licenseKey: cs.licenseKey || undefined,
          };
        });

        return {
          roomId: room.id,
          roomName: room.name,
          roomCode: room.roomCode,
          building: room.building,
          floor: room.floor,
          roomNumber: room.roomNumber,
          totalComputers,
          components: components.map((comp) => ({
            componentType: comp.componentType,
            name: comp.name,
            specs: comp.componentSpecs,
            serialNumber: comp.serialNumber,
          })),
          software,
        };
      })
    );

    return roomStatistics;
  }
}
