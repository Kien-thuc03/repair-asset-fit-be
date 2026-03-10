import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from '../../entities/asset.entity';
import { Computer } from '../../entities/computer.entity';
import { ComputerComponent } from '../../entities/computer-component.entity';
import { Room } from '../../entities/room.entity';
import { AssetsMigrationService } from './assets-migration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Asset, Computer, ComputerComponent, Room]),
  ],
  providers: [AssetsMigrationService],
  exports: [AssetsMigrationService],
})
export class AssetsModule {}
