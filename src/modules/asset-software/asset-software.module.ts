import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AssetSoftwareController } from "./asset-software.controller";
import { AssetSoftwareService } from "./asset-software.service";
import { AssetSoftware } from "src/entities/asset-software.entity";
import { Asset } from "src/entities/asset.entity";
import { Software } from "src/entities/software.entity";

@Module({
  imports: [TypeOrmModule.forFeature([AssetSoftware, Asset, Software])],
  controllers: [AssetSoftwareController],
  providers: [AssetSoftwareService],
  exports: [AssetSoftwareService], // Export nếu modules khác cần dùng
})
export class AssetSoftwareModule {}
