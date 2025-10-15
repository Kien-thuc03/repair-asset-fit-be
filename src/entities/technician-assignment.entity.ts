import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('technicianAssignments')
export class TechnicianAssignment {
  @PrimaryColumn({ name: 'technicianId' })
  technicianId: string;

  @PrimaryColumn({ type: 'text' })
  building: string;

  @PrimaryColumn({ type: 'text' })
  floor: string;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn({ name: 'technicianId' })
  technician: User;
}
