import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { Computer } from './computer.entity';
import { User } from './user.entity';
import { ErrorType } from './error-type.entity';
import { RepairStatus } from 'src/common/shared/RepairStatus';
import { RepairLog } from './repair-log.entity';
import { RepairRequestComponent } from './repair-request-component.entity';

@Entity('repairRequests')
export class RepairRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'requestCode' })
  requestCode: string;

  @Column({ name: 'computerAssetId' })
  computerAssetId: string;

  @Column({ name: 'reporterId' })
  reporterId: string;

  @Column({ name: 'assignedTechnicianId', nullable: true })
  assignedTechnicianId: string;

  @Column({ name: 'errorTypeId', nullable: true })
  errorTypeId: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true, name: 'mediaUrls' })
  mediaUrls: string;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    default: RepairStatus.CHỜ_TIẾP_NHẬN,
  })
  status: RepairStatus;

  @Column({ type: 'text', nullable: true, name: 'resolutionNotes' })
  resolutionNotes: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'acceptedAt' })
  acceptedAt: Date;

  @Column({ type: 'timestamp', nullable: true, name: 'completedAt' })
  completedAt: Date;

  // Relations
  @ManyToOne(() => Computer)
  @JoinColumn({ name: 'computerAssetId' })
  computer: Computer;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'reporterId' })
  reporter: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedTechnicianId' })
  assignedTechnician?: User;

  @ManyToOne(() => ErrorType, { nullable: true })
  @JoinColumn({ name: 'errorTypeId' })
  errorType?: ErrorType;

  @OneToMany(() => RepairLog, (log) => log.repairRequest)
  logs?: RepairLog[];

  @OneToMany(() => RepairRequestComponent, (component) => component.repairRequest)
  components?: RepairRequestComponent[];
}
