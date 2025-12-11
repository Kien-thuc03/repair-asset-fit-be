import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RepairsService } from "./repairs.service";
import { RepairsController } from "./repairs.controller";
import { RepairRequest } from "src/entities/repair-request.entity";
import { RepairLog } from "src/entities/repair-log.entity";
import { Asset } from "src/entities/asset.entity";
import { User } from "src/entities/user.entity";
import { ComputerComponent } from "src/entities/computer-component.entity";
import { Computer } from "src/entities/computer.entity";
import { ComputerSoftware } from "src/entities/computer-software.entity";
import { Software } from "src/entities/software.entity";
import { TechnicianAssignment } from "src/entities/technician-assignment.entity";
import { Room } from "src/entities/room.entity";
import { EmailModule } from "../email/email.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RepairRequest,
      RepairLog,
      Asset,
      User,
      ComputerComponent,
      Computer,
      ComputerSoftware,
      Software,
      TechnicianAssignment,
      Room,
    ]),
    EmailModule,
  ],
  controllers: [RepairsController],
  providers: [RepairsService],
  exports: [RepairsService],
})
export class RepairsModule {}
