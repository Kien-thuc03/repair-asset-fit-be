import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ComputerSoftware } from "src/entities/computer-software.entity";
import { Computer } from "src/entities/computer.entity";

@Injectable()
export class AssetSoftwareService {
  constructor(
    @InjectRepository(ComputerSoftware)
    private readonly computerSoftwareRepository: Repository<ComputerSoftware>,
    @InjectRepository(Computer)
    private readonly computerRepository: Repository<Computer>
  ) {}

  async getSoftwareByAsset(assetId: string) {
    // Tìm computer thông qua assetId
    const computer = await this.computerRepository.findOne({
      where: { assetId },
      relations: ["asset"],
    });
    
    if (!computer) {
      return {
        success: false,
        message: "Không tìm thấy máy tính với assetId này",
        statusCode: 404,
      };
    }

    const computerSoftwareList = await this.computerSoftwareRepository.find({
      where: { computerId: computer.id },
      relations: ["software"],
      order: { installationDate: "DESC" },
    });

    const software = computerSoftwareList.map((item) => ({
      softwareId: item.softwareId,
      name: item.software.name,
      version: item.software.version,
      publisher: item.software.publisher,
      installationDate: item.installationDate,
      licenseKey: item.licenseKey,
      notes: item.notes,
    }));

    return {
      success: true,
      message: "Lấy danh sách phần mềm thành công",
      data: {
        assetId: computer.assetId,
        computerId: computer.id,
        assetName: computer.asset?.name,
        machineLabel: computer.machineLabel,
        totalSoftware: software.length,
        software,
      },
    };
  }

  async getSoftwareDetail(assetId: string, softwareId: string) {
    // Tìm computer thông qua assetId
    const computer = await this.computerRepository.findOne({
      where: { assetId },
      relations: ["asset"],
    });

    if (!computer) {
      return {
        success: false,
        message: "Không tìm thấy máy tính với assetId này",
        statusCode: 404,
      };
    }

    const computerSoftware = await this.computerSoftwareRepository.findOne({
      where: { computerId: computer.id, softwareId },
      relations: ["computer", "computer.asset", "software"],
    });

    if (!computerSoftware) {
      return {
        success: false,
        message: "Không tìm thấy phần mềm trên máy tính này",
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Lấy thông tin phần mềm thành công",
      data: {
        id: computerSoftware.id,
        assetId: computer.assetId,
        computerId: computer.id,
        softwareId: computerSoftware.softwareId,
        assetName: computer.asset?.name,
        machineLabel: computer.machineLabel,
        software: {
          id: computerSoftware.software.id,
          name: computerSoftware.software.name,
          version: computerSoftware.software.version,
          publisher: computerSoftware.software.publisher,
        },
        installationDate: computerSoftware.installationDate,
        licenseKey: computerSoftware.licenseKey,
        notes: computerSoftware.notes,
        createdAt: computerSoftware.createdAt,
        updatedAt: computerSoftware.updatedAt,
      },
    };
  }
}
