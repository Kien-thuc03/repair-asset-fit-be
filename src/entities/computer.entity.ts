import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Room } from './room.entity';
import { ComputerComponent } from './computer-component.entity';
import { AssetSoftware } from './asset-software.entity';

@Entity('computers')
export class Computer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'assetId' })
  assetId: string;

  @Column({ name: 'roomId' })
  roomId: string;

  @Column({ name: 'machineLabel' })
  machineLabel: string;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => Asset, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'assetId' })
  asset: Asset;

  @ManyToOne(() => Room, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @OneToMany(() => ComputerComponent, (component) => component.computer)
  components?: ComputerComponent[];

  @OneToMany(() => AssetSoftware, (software) => software.computer)
  software?: AssetSoftware[];
}
