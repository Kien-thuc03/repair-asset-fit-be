import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SoftwareProposalsController } from "./software-proposals.controller";
import { SoftwareProposalsService } from "./software-proposals.service";
import { SoftwareProposal } from "src/entities/software-proposal.entity";
import { SoftwareProposalItem } from "src/entities/software-proposal-item.entity";
import { Room } from "src/entities/room.entity";
import { Software } from "src/entities/software.entity";
import { User } from "src/entities/user.entity";
import { TechnicianAssignment } from "src/entities/technician-assignment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SoftwareProposal,
      SoftwareProposalItem,
      Room,
      Software,
      User,
      TechnicianAssignment,
    ]),
  ],
  controllers: [SoftwareProposalsController],
  providers: [SoftwareProposalsService],
  exports: [SoftwareProposalsService],
})
export class SoftwareProposalsModule {}
