import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Room } from './room.entity';

export enum DamageReportStatus {
  REPORTED = 'REPORTED',
  IN_REVIEW = 'IN_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

@Entity('damageReports')
export class DamageReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  assetId: string;

  @Column({ type: 'text', nullable: true })
  reporter: string;

  @Column({ nullable: true })
  roomId: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', nullable: true })
  mediaUrl: string;

  @Column({
    type: 'enum',
    enum: DamageReportStatus,
    default: DamageReportStatus.REPORTED,
  })
  status: DamageReportStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'assetId' })
  asset?: Asset;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'roomId' })
  room?: Room;
}
