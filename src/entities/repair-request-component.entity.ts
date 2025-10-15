import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RepairRequest } from './repair-request.entity';
import { ComputerComponent } from './computer-component.entity';

@Entity('repairRequestComponents')
export class RepairRequestComponent {
  @PrimaryColumn({ name: 'repairRequestId' })
  repairRequestId: string;

  @PrimaryColumn({ name: 'componentId' })
  componentId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  // Relations
  @ManyToOne(() => RepairRequest, (request) => request.components)
  @JoinColumn({ name: 'repairRequestId' })
  repairRequest: RepairRequest;

  @ManyToOne(() => ComputerComponent)
  @JoinColumn({ name: 'componentId' })
  component: ComputerComponent;
}
