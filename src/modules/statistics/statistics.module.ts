import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StatisticsController } from "./statistics.controller";
import { StatisticsService } from "./statistics.service";
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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RepairRequest,
      ReplacementProposal,
      SoftwareProposal,
      ReplacementItem,
      SoftwareProposalItem,
      Room,
      Computer,
      ComputerComponent,
      ComputerSoftware,
      Software,
    ]),
  ],
  controllers: [StatisticsController],
  providers: [StatisticsService],
  exports: [StatisticsService],
})
export class StatisticsModule {}

