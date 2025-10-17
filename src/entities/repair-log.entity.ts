import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { RepairRequest } from './repair-request.entity';
import { User } from './user.entity';
import { RepairStatus } from '../common/shared/RepairStatus';

@Entity('repair_logs')
export class RepairLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    repairRequestId: string;

    @Column({ comment: 'Người thực hiện hành động' })
    actorId: string;

    @Column({ comment: 'Hành động đã thực hiện, vd: "Tạo yêu cầu", "Tiếp nhận xử lý", "Gửi đề xuất thay thế", "Hoàn tất"' })
    action: string;

    @Column({
        type: 'enum',
        enum: RepairStatus,
        nullable: true,
        comment: 'Trạng thái trước khi thay đổi',
    })
    fromStatus?: RepairStatus;

    @Column({
        type: 'enum',
        enum: RepairStatus,
        nullable: true,
        comment: 'Trạng thái sau khi thay đổi',
    })
    toStatus?: RepairStatus;

    @Column({ type: 'text', nullable: true, comment: 'Ghi chú cho hành động này' })
    comment?: string;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @ManyToOne(() => RepairRequest, (repairRequest) => repairRequest.logs)
    @JoinColumn({ name: 'repairRequestId' })
    repairRequest: RepairRequest;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'actorId' })
    actor: User;
}
