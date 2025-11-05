import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { AssetSoftware } from "src/entities/asset-software.entity";
import { Asset } from "src/entities/asset.entity";

@Injectable()
export class AssetSoftwareService {
  constructor(
    @InjectRepository(AssetSoftware)
    private readonly assetSoftwareRepository: Repository<AssetSoftware>,
    @InjectRepository(Asset)
    private readonly assetRepository: Repository<Asset>
  ) {}

  async getSoftwareByAsset(assetId: string) {
    const asset = await this.assetRepository.findOne({
      where: { id: assetId },
    });
    if (!asset) {
      return {
        success: false,
        message: "Không tìm thấy tài sản",
        statusCode: 404,
      };
    }

    const assetSoftwareList = await this.assetSoftwareRepository.find({
      where: { assetId },
      relations: ["software"],
      order: { installationDate: "DESC" },
    });

    const software = assetSoftwareList.map((item) => ({
      softwareId: item.softwareId,
      name: item.software.name,
      version: item.software.version,
      publisher: item.software.publisher,
      installationDate: item.installationDate,
      notes: item.notes,
    }));

    return {
      success: true,
      message: "Lấy danh sách phần mềm thành công",
      data: {
        assetId: asset.id,
        assetName: asset.name,
        totalSoftware: software.length,
        software,
      },
    };
  }

  async getSoftwareDetail(assetId: string, softwareId: string) {
    const assetSoftware = await this.assetSoftwareRepository.findOne({
      where: { assetId, softwareId },
      relations: ["asset", "software"],
    });

    if (!assetSoftware) {
      return {
        success: false,
        message: "Không tìm thấy phần mềm trên tài sản này",
        statusCode: 404,
      };
    }

    return {
      success: true,
      message: "Lấy thông tin phần mềm thành công",
      data: {
        assetId: assetSoftware.assetId,
        softwareId: assetSoftware.softwareId,
        assetName: assetSoftware.asset.name,
        software: {
          id: assetSoftware.software.id,
          name: assetSoftware.software.name,
          version: assetSoftware.software.version,
          publisher: assetSoftware.software.publisher,
        },
        installationDate: assetSoftware.installationDate,
        notes: assetSoftware.notes,
      },
    };
  }
}
