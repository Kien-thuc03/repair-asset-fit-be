import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToMany,
    JoinTable,
} from 'typeorm';
import { User } from './user.entity';
import { ReplacementStatus } from '../common/shared/ReplacementStatus';
import { ReplacementItem } from './replacement-item.entity';
import { RepairRequest } from './repair-request.entity';

@Entity('replacement_proposals')
export class ReplacementProposal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true, comment: 'Tiêu đề đề xuất' })
    title?: string;

    @Column({ type: 'text', nullable: true, comment: 'Mô tả đề xuất' })
    description?: string;

    @Column({ unique: true, comment: 'Mã đề xuất, vd: DXTT-2025-0001' })
    proposalCode: string;

    @Column({ comment: 'Kỹ thuật viên lập đề xuất' })
    proposerId: string;

    @Column({ nullable: true, comment: 'Tổ trưởng kỹ thuật duyệt' })
    teamLeadApproverId?: string;

    @Column({ nullable: true, comment: 'Người của Phòng Quản trị đi xác minh' })
    adminVerifierId?: string;

    @Column({
        type: 'enum',
        enum: ReplacementStatus,
        default: ReplacementStatus.CHỜ_TỔ_TRƯỞNG_DUYỆT,
    })
    status: ReplacementStatus;

    @Column({ nullable: true, comment: 'Đường dẫn file Tờ trình' })
    submissionFormUrl?: string;

    @Column({ nullable: true, comment: 'Đường dẫn file Biên bản xác nhận tại hiện trường' })
    verificationReportUrl?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'proposerId' })
    proposer: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'teamLeadApproverId' })
    teamLeadApprover?: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'adminVerifierId' })
    adminVerifier?: User;

    @OneToMany(() => ReplacementItem, (item) => item.proposal)
    items?: ReplacementItem[];

    @ManyToMany(() => RepairRequest, (repairRequest) => repairRequest.replacementProposals)
    @JoinTable({
        name: 'proposal_repair_requests',
        joinColumn: { name: 'proposalId', referencedColumnName: 'id' },
        inverseJoinColumn: { name: 'repairRequestId', referencedColumnName: 'id' },
    })
    repairRequests?: RepairRequest[];
}
