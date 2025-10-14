import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { RepairStatus, RepairPriority } from '../common/utils/constants';
import { User } from './user.entity';
import { Technician } from './technician.entity';
import { RepairCategory } from './repair-category.entity';
import { FileUrl } from './file-url.entity';

@Entity('repair_requests')
export class RepairRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  location: string;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    default: RepairStatus.PENDING,
  })
  status: RepairStatus;

  @Column({
    type: 'enum',
    enum: RepairPriority,
    default: RepairPriority.MEDIUM,
  })
  priority: RepairPriority;

  @Column({ nullable: true })
  estimatedCost: number;

  @Column({ nullable: true })
  actualCost: number;

  @Column({ nullable: true })
  notes: string;

  @Column({ nullable: true })
  completedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, user => user.repairRequests)
  @JoinColumn({ name: 'requested_by_id' })
  requestedBy: User;

  @Column()
  requestedById: string;

  @ManyToOne(() => Technician, technician => technician.repairRequests, { nullable: true })
  @JoinColumn({ name: 'assigned_technician_id' })
  assignedTechnician: Technician;

  @Column({ nullable: true })
  assignedTechnicianId: string;

  @ManyToOne(() => RepairCategory, category => category.repairRequests)
  @JoinColumn({ name: 'category_id' })
  category: RepairCategory;

  @Column()
  categoryId: string;

  @OneToMany(() => FileUrl, fileUrl => fileUrl.repairRequest)
  attachments: FileUrl[];
}