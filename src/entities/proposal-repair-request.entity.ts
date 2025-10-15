import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReplacementProposal } from './replacement-proposal.entity';
import { RepairRequest } from './repair-request.entity';

@Entity('proposalRepairRequests')
export class ProposalRepairRequest {
  @PrimaryColumn({ name: 'proposalId' })
  proposalId: string;

  @PrimaryColumn({ name: 'repairRequestId' })
  repairRequestId: string;

  // Relations
  @ManyToOne(() => ReplacementProposal)
  @JoinColumn({ name: 'proposalId' })
  proposal: ReplacementProposal;

  @ManyToOne(() => RepairRequest)
  @JoinColumn({ name: 'repairRequestId' })
  repairRequest: RepairRequest;
}
