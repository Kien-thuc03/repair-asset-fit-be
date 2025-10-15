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
import { User } from './user.entity';
import { Room } from './room.entity';
import { SoftwareProposalStatus } from 'src/common/shared/SoftwareProposalStatus';
import { SoftwareProposalItem } from './software-proposal-item.entity';

@Entity('softwareProposals')
export class SoftwareProposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', name: 'proposalCode' })
  proposalCode: string;

  @Column({ name: 'proposerId' })
  proposerId: string;

  @Column({ name: 'approverId', nullable: true })
  approverId: string;

  @Column({ name: 'roomId' })
  roomId: string;

  @Column({ type: 'text' })
  reason: string;

  @Column({
    type: 'enum',
    enum: SoftwareProposalStatus,
    default: SoftwareProposalStatus.CHỜ_DUYỆT,
  })
  status: SoftwareProposalStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'proposerId' })
  proposer: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approverId' })
  approver?: User;

  @ManyToOne(() => Room)
  @JoinColumn({ name: 'roomId' })
  room: Room;

  @OneToMany(() => SoftwareProposalItem, (item) => item.proposal)
  items?: SoftwareProposalItem[];
}
