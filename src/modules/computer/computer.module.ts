import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComputerService } from './computer.service';
import { ComputerController } from './computer.controller';
import { Computer } from '../../entities/computer.entity';
import { ComputerComponent } from '../../entities/computer-component.entity';
import { RepairRequest } from '../../entities/repair-request.entity';
import { ReplacementItem } from '../../entities/replacement-item.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Computer, ComputerComponent, RepairRequest, ReplacementItem])],
  controllers: [ComputerController],
  providers: [ComputerService],
  exports: [ComputerService],
})
export class ComputerModule {}
