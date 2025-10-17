import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { Room } from './room.entity';
import { SoftwareProposalStatus } from '../common/shared/SoftwareProposalStatus';
import { SoftwareProposalItem } from './software-proposal-item.entity';

@Entity('software_proposals')
export class SoftwareProposal {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, comment: 'Mã đề xuất, vd: DXPM-2025-0001' })
    proposalCode: string;

    @Column({ comment: 'Người tạo đề xuất' })
    proposerId: string;

    @Column({ nullable: true, comment: 'Người duyệt đề xuất' })
    approverId?: string;

    @Column({ comment: 'Phòng máy cần trang bị phần mềm' })
    roomId: string;

    @Column({ type: 'text', comment: 'Lý do cần trang bị phần mềm' })
    reason: string;

    @Column({
        type: 'enum',
        enum: SoftwareProposalStatus,
        default: SoftwareProposalStatus.CHỜ_DUYỆT,
    })
    status: SoftwareProposalStatus;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    // Relations
    @ManyToOne(() => User)
    @JoinColumn({ name: 'proposerId' })
    proposer: User;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'approverId' })
    approver?: User;

    @ManyToOne(() => Room)
    @JoinColumn({ name: 'roomId' })
    room: Room;

    @OneToMany(() => SoftwareProposalItem, (item) => item.proposal)
    items?: SoftwareProposalItem[];
}
