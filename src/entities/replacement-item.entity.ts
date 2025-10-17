import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { ReplacementProposal } from './replacement-proposal.entity';
import { ComputerComponent } from './computer-component.entity';

@Entity('replacement_items')
export class ReplacementItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    proposalId: string;

    @Column({ nullable: true, comment: 'Linh kiện cũ bị hỏng cần thay' })
    oldComponentId?: string;

    @Column({ comment: 'Tên linh kiện/thiết bị mới cần mua' })
    newItemName: string;

    @Column({ type: 'text', nullable: true, comment: 'Thông số kỹ thuật chi tiết' })
    newItemSpecs?: string;

    @Column({ default: 1 })
    quantity: number;

    @Column({ type: 'text', nullable: true, comment: 'Lý do cần thay thế' })
    reason?: string;

    @Column({ nullable: true, comment: 'ID của tài sản mới sau khi được mua và sử dụng' })
    newlyPurchasedComponentId?: string;

    // Relations
    @ManyToOne(() => ReplacementProposal, (proposal) => proposal.items)
    @JoinColumn({ name: 'proposalId' })
    proposal: ReplacementProposal;

    @ManyToOne(() => ComputerComponent, (component) => component.replacementItemsAsOld, { nullable: true })
    @JoinColumn({ name: 'oldComponentId' })
    oldComponent?: ComputerComponent;

    @ManyToOne(() => ComputerComponent, (component) => component.replacementItemsAsNew, { nullable: true })
    @JoinColumn({ name: 'newlyPurchasedComponentId' })
    newlyPurchasedComponent?: ComputerComponent;
}
