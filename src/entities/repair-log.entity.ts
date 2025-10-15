import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { RepairRequest } from './repair-request.entity';
import { User } from './user.entity';
import { RepairStatus } from 'src/common/shared/RepairStatus';

@Entity('repairLogs')
export class RepairLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'repairRequestId' })
  repairRequestId: string;

  @Column({ name: 'actorId' })
  actorId: string;

  @Column({ type: 'text' })
  action: string;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    nullable: true,
    name: 'fromStatus',
  })
  fromStatus: RepairStatus;

  @Column({
    type: 'enum',
    enum: RepairStatus,
    nullable: true,
    name: 'toStatus',
  })
  toStatus: RepairStatus;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => RepairRequest, (request) => request.logs)
  @JoinColumn({ name: 'repairRequestId' })
  repairRequest: RepairRequest;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'actorId' })
  actor: User;
}
