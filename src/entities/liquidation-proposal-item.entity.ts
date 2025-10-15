import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { LiquidationProposal } from './liquidation-proposal.entity';
import { Asset } from './asset.entity';
import { LiquidationProposalItemCondition } from 'src/common/shared/LiquidationProposalItemCondition';

@Entity('LiquidationProposalItems')
export class LiquidationProposalItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proposalId', nullable: true })
  proposalId: string;

  @Column({ name: 'assetId', nullable: true })
  assetId: string;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({
    type: 'enum',
    enum: LiquidationProposalItemCondition,
    nullable: true,
  })
  condition: LiquidationProposalItemCondition;

  @Column({ type: 'text', nullable: true, name: 'mediaUrl' })
  mediaUrl: string;

  // Relations
  @ManyToOne(() => LiquidationProposal, (proposal) => proposal.items, { nullable: true })
  @JoinColumn({ name: 'proposalId' })
  proposal?: LiquidationProposal;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'assetId' })
  asset?: Asset;
}
