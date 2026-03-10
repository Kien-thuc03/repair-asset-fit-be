import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AssetSoftwareController } from './asset-software.controller';
import { AssetSoftwareService } from './asset-software.service';
import { ComputerSoftware } from 'src/entities/computer-software.entity';
import { Computer } from 'src/entities/computer.entity';
import { Software } from 'src/entities/software.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ComputerSoftware, Computer, Software])],
  controllers: [AssetSoftwareController],
  providers: [AssetSoftwareService],
  exports: [AssetSoftwareService],
})
export class AssetSoftwareModule {}
