import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    OneToMany,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { Asset } from './asset.entity';
import { User } from './user.entity';
import { ErrorType } from './error-type.entity';
import { RepairStatus } from '../common/shared/RepairStatus';
import { RepairLog } from './repair-log.entity';
import { ComputerComponent } from './computer-component.entity';
import { ReplacementProposal } from './replacement-proposal.entity';

@Entity('repair_requests')
export class RepairRequest {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, comment: 'Mã yêu cầu tự tăng, vd: YCSC-2025-0001' })
    requestCode: string;

    @Column({ comment: 'Tài sản (máy tính) gặp sự cố' })
    computerAssetId: string;

    @Column({ comment: 'Người báo lỗi (Giảng viên hoặc KTV)' })
    reporterId: string;

    @Column({ nullable: true, comment: 'KTV được phân công xử lý' })
    assignedTechnicianId?: string;

    @Column({ nullable: true, comment: 'Phân loại lỗi theo danh mục có sẵn' })
    errorTypeId?: string;

    @Column({ type: 'text', comment: 'Mô tả chi tiết tình trạng lỗi' })
    description: string;

    @Column({ type: 'simple-array', nullable: true, comment: 'Mảng các đường dẫn ảnh/video minh họa lỗi' })
    mediaUrls?: string[];

    @Column({
        type: 'enum',
        enum: RepairStatus,
        default: RepairStatus.CHỜ_TIẾP_NHẬN,
    })
    status: RepairStatus;

    @Column({ type: 'text', nullable: true, comment: 'Ghi chú của KTV về kết quả xử lý (sửa được gì, thay thế ra sao)' })
    resolutionNotes?: string;

    @CreateDateColumn({ comment: 'Thời điểm báo lỗi' })
    createdAt: Date;

    @Column({ type: 'timestamp', nullable: true, comment: 'Thời điểm KTV tiếp nhận' })
    acceptedAt?: Date;

    @Column({ type: 'timestamp', nullable: true, comment: 'Thời điểm hoàn tất xử lý' })
    completedAt?: Date;

    // Relations
    @ManyToOne(() => Asset)
    @JoinColumn({ name: 'computerAssetId' })
    computerAsset: Asset;

    @ManyToOne(() => User)
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assignedTechnicianId' })
    assignedTechnician?: User;

    @ManyToOne(() => ErrorType, (errorType) => errorType.repairRequests, { nullable: true })
    @JoinColumn({ name: 'errorTypeId' })
    errorType?: ErrorType;

    @OneToMany(() => RepairLog, (log) => log.repairRequest)
    logs?: RepairLog[];

    @ManyToMany(() => ComputerComponent, (component) => component.repairRequests)
    @JoinTable({
        name: 'repair_request_components',
        joinColumn: { name: 'repairRequestId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'componentId', referencedColumnName: 'id' },
    })
    components?: ComputerComponent[];

    @ManyToMany(() => ReplacementProposal, (proposal) => proposal.repairRequests)
    replacementProposals?: ReplacementProposal[];
}
