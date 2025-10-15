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
import { ReplacementStatus } from 'src/common/shared/ReplacementStatus';
import { ReplacementItem } from './replacement-item.entity';

@Entity('replacementProposals')
export class ReplacementProposal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: true })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'text', name: 'proposalCode' })
  proposalCode: string;

  @Column({ name: 'proposerId' })
  proposerId: string;

  @Column({ name: 'teamLeadApproverId', nullable: true })
  teamLeadApproverId: string;

  @Column({ name: 'adminVerifierId', nullable: true })
  adminVerifierId: string;

  @Column({
    type: 'enum',
    enum: ReplacementStatus,
    default: ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT,
  })
  status: ReplacementStatus;

  @Column({ type: 'text', nullable: true, name: 'submissionFormUrl' })
  submissionFormUrl: string;

  @Column({ type: 'text', nullable: true, name: 'verificationReportUrl' })
  verificationReportUrl: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'proposerId' })
  proposer: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'teamLeadApproverId' })
  teamLeadApprover?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'adminVerifierId' })
  adminVerifier?: User;

  @OneToMany(() => ReplacementItem, (item) => item.proposal)
  items?: ReplacementItem[];
}
