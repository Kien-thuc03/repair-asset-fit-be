import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Computer } from './computer.entity';
import { ComponentType } from 'src/common/shared/ComponentType';
import { ComponentStatus } from 'src/common/shared/ComponentStatus';

@Entity('computerComponents')
export class ComputerComponent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'computerAssetId' })
  computerAssetId: string;

  @Column({
    type: 'enum',
    enum: ComponentType,
    name: 'componentType',
  })
  componentType: ComponentType;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true, name: 'componentSpecs' })
  componentSpecs: string;

  @Column({ type: 'text', nullable: true, name: 'serialNumber' })
  serialNumber: string;

  @Column({
    type: 'enum',
    enum: ComponentStatus,
    default: ComponentStatus.INSTALLED,
  })
  status: ComponentStatus;

  @CreateDateColumn({ name: 'installedAt', nullable: true })
  installedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'removedAt' })
  removedAt: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  // Relations
  @ManyToOne(() => Computer, (computer) => computer.components, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'computerAssetId' })
  computer: Computer;
}
