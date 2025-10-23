import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RepairsService } from "./repairs.service";
import { RepairsController } from "./repairs.controller";
import { RepairRequest } from "src/entities/repair-request.entity";
import { Asset } from "src/entities/asset.entity";
import { User } from "src/entities/user.entity";
import { ComputerComponent } from "src/entities/computer-component.entity";
import { Computer } from "src/entities/computer.entity";
import { AssetSoftware } from "src/entities/asset-software.entity";
import { Software } from "src/entities/software.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RepairRequest,
      Asset,
      User,
      ComputerComponent,
      Computer,
      AssetSoftware,
      Software,
    ]),
  ],
  controllers: [RepairsController],
  providers: [RepairsService],
  exports: [RepairsService],
})
export class RepairsModule {}
