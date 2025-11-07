import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReplacementProposalsController } from "./replacement-proposals.controller";
import { ReplacementProposalsService } from "./replacement-proposals.service";
import { ReplacementProposal } from "../../entities/replacement-proposal.entity";
import { ReplacementItem } from "../../entities/replacement-item.entity";
import { RepairRequest } from "../../entities/repair-request.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReplacementProposal,
      ReplacementItem,
      RepairRequest,
    ]),
  ],
  controllers: [ReplacementProposalsController],
  providers: [ReplacementProposalsService],
  exports: [ReplacementProposalsService],
})
export class ReplacementProposalsModule {}
