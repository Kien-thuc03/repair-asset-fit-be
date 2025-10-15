import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { ReplacementProposal } from './replacement-proposal.entity';
import { ComputerComponent } from './computer-component.entity';

@Entity('replacementItems')
export class ReplacementItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'proposalId' })
  proposalId: string;

  @Column({ name: 'oldComponentId', nullable: true })
  oldComponentId: string;

  @Column({ type: 'text', name: 'newItemName' })
  newItemName: string;

  @Column({ type: 'text', nullable: true, name: 'newItemSpecs' })
  newItemSpecs: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ name: 'newlyPurchasedComponentId', nullable: true })
  newlyPurchasedComponentId: string;

  // Relations
  @ManyToOne(() => ReplacementProposal, (proposal) => proposal.items)
  @JoinColumn({ name: 'proposalId' })
  proposal: ReplacementProposal;

  @ManyToOne(() => ComputerComponent, { nullable: true })
  @JoinColumn({ name: 'oldComponentId' })
  oldComponent?: ComputerComponent;

  @ManyToOne(() => ComputerComponent, { nullable: true })
  @JoinColumn({ name: 'newlyPurchasedComponentId' })
  newlyPurchasedComponent?: ComputerComponent;
}
