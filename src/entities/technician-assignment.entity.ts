import {
    Entity,
    Column,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('technician_assignments')
export class TechnicianAssignment {
    @PrimaryColumn({ comment: 'ID của Kỹ thuật viên' })
    technicianId: string;

    @PrimaryColumn({ comment: 'Tên tòa nhà được phân công' })
    building: string;

    @Column({ nullable: true, comment: 'Tên tầng được phân công, null nếu quản lý cả tòa' })
    floor?: string;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'technicianId' })
    technician: User;
}
