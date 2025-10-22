import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
    Index,
} from 'typeorm';
import { User } from './user.entity';

@Entity('technician_assignments')
@Index('UQ_technician_building_floor', ['technicianId', 'building', 'floor'], { unique: true })
@Index('IDX_technician_assignments_technician', ['technicianId'])
@Index('IDX_technician_assignments_building', ['building'])
@Index('IDX_technician_assignments_building_floor', ['building', 'floor'])
export class TechnicianAssignment {
    @PrimaryGeneratedColumn('uuid', { comment: 'ID duy nhất của phân công' })
    id: string;

    @Column({ type: 'uuid', comment: 'ID của Kỹ thuật viên' })
    technicianId: string;

    @Column({ type: 'varchar', comment: 'Tên tòa nhà được phân công' })
    building: string;

    @Column({ type: 'varchar', nullable: true, comment: 'Tên tầng được phân công, null nếu quản lý cả tòa' })
    floor?: string;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'technicianId' })
    technician: User;
}
