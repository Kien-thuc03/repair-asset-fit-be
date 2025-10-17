import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { SoftwareProposal } from './software-proposal.entity';
import { Software } from './software.entity';

@Entity('software_proposal_items')
export class SoftwareProposalItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    proposalId: string;

    @Column({ comment: 'Tên phần mềm cần mua' })
    softwareName: string;

    @Column({ nullable: true })
    version?: string;

    @Column({ nullable: true, comment: 'Nhà sản xuất' })
    publisher?: string;

    @Column({ default: 1, comment: 'Số lượng license cần mua' })
    quantity: number;

    @Column({ nullable: true, comment: 'Loại giấy phép: Vĩnh viễn, Theo năm...' })
    licenseType?: string;

    @Column({ nullable: true, comment: 'ID trong bảng Software sau khi được thêm vào' })
    newlyAcquiredSoftwareId?: string;

    // Relations
    @ManyToOne(() => SoftwareProposal, (proposal) => proposal.items)
    @JoinColumn({ name: 'proposalId' })
    proposal: SoftwareProposal;

    @ManyToOne(() => Software, (software) => software.proposalItems, { nullable: true })
    @JoinColumn({ name: 'newlyAcquiredSoftwareId' })
    newlyAcquiredSoftware?: Software;
}
