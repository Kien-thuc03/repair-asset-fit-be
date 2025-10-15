import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Unit } from './unit.entity';
import { User } from './user.entity';
import { LiquidationStatus } from 'src/common/shared/LiquidationStatus';
import { LiquidationProposalItem } from './liquidation-proposal-item.entity';

@Entity('LiquidationProposals')
export class LiquidationProposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proposerId', nullable: true })
  proposerId: string;

  @Column({ name: 'unitId', nullable: true })
  unitId: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: LiquidationStatus,
    nullable: true,
  })
  status: LiquidationStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'proposerId' })
  proposer?: User;

  @ManyToOne(() => Unit, { nullable: true })
  @JoinColumn({ name: 'unitId' })
  unit?: Unit;

  @OneToMany(() => LiquidationProposalItem, (item) => item.proposal)
  items?: LiquidationProposalItem[];
}
