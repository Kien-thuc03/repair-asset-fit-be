import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { InventoryCommittee } from './inventory-committee.entity';
import { User } from './user.entity';
import { InventoryCommitteeRole } from 'src/common/shared/InventoryCommitteeRole';

@Entity('inventoryCommitteeMembers')
export class InventoryCommitteeMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'committeeId', nullable: true })
  committeeId: string;

  @Column({ name: 'userId', nullable: true })
  userId: string;

  @Column({ type: 'text', nullable: true })
  responsibility: string;

  @Column({
    type: 'enum',
    enum: InventoryCommitteeRole,
    nullable: true,
  })
  role: InventoryCommitteeRole;

  // Relations
  @ManyToOne(() => InventoryCommittee, (committee) => committee.members, { nullable: true })
  @JoinColumn({ name: 'committeeId' })
  committee?: InventoryCommittee;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;
}
