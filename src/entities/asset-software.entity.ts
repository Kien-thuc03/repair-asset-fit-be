import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Computer } from './computer.entity';
import { Software } from './software.entity';

@Entity('assetSoftware')
export class AssetSoftware {
  @PrimaryColumn({ name: 'computerId' })
  computerId: string;

  @PrimaryColumn({ name: 'softwareId' })
  softwareId: string;

  // Relations
  @ManyToOne(() => Computer, (computer) => computer.software, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'computerId' })
  computer: Computer;

  @ManyToOne(() => Software, (software) => software.assetSoftware, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'softwareId' })
  software: Software;
}
