import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SoftwareProposal } from './software-proposal.entity';
import { Software } from './software.entity';

@Entity('softwareProposalItems')
export class SoftwareProposalItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proposalId' })
  proposalId: string;

  @Column({ type: 'text', name: 'softwareName' })
  softwareName: string;

  @Column({ type: 'text', nullable: true })
  version: string;

  @Column({ type: 'text', nullable: true })
  publisher: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'text', nullable: true, name: 'licenseType' })
  licenseType: string;

  @Column({ name: 'newlyAcquiredSoftwareId', nullable: true })
  newlyAcquiredSoftwareId: string;

  // Relations
  @ManyToOne(() => SoftwareProposal, (proposal) => proposal.items)
  @JoinColumn({ name: 'proposalId' })
  proposal: SoftwareProposal;

  @ManyToOne(() => Software, { nullable: true })
  @JoinColumn({ name: 'newlyAcquiredSoftwareId' })
  newlyAcquiredSoftware?: Software;
}
