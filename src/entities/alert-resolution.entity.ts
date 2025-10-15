import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Alert } from './alert.entity';
import { User } from './user.entity';
import { AlertResolutionStatus } from 'src/common/shared/AlertResolutionStatus';

@Entity('alertResolutions')
export class AlertResolution {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'alertId', nullable: true })
  alertId: string;

  @Column({ name: 'resolverId', nullable: true })
  resolverId: string;

  @Column({
    type: 'enum',
    enum: AlertResolutionStatus,
    nullable: true,
  })
  resolution: AlertResolutionStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'timestamp', nullable: true, name: 'resolvedAt' })
  resolvedAt: Date;

  // Relations
  @ManyToOne(() => Alert, { nullable: true })
  @JoinColumn({ name: 'alertId' })
  alert?: Alert;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'resolverId' })
  resolver?: User;
}
