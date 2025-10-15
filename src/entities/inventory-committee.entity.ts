import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { InventorySession } from './inventory-session.entity';
import { InventoryCommitteeMember } from './inventory-committee-member.entity';

@Entity('inventoryCommittees')
export class InventoryCommittee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'sessionId', nullable: true })
  sessionId: string;

  @Column({ type: 'text', nullable: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @ManyToOne(() => InventorySession, { nullable: true })
  @JoinColumn({ name: 'sessionId' })
  session?: InventorySession;

  @OneToMany(() => InventoryCommitteeMember, (member) => member.committee)
  members?: InventoryCommitteeMember[];
}
