import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    OneToMany,
    ManyToMany,
} from 'typeorm';
import { Asset } from './asset.entity';
import { ComponentType } from '../common/shared/ComponentType';
import { ComponentStatus } from '../common/shared/ComponentStatus';
import { Computer } from './computer.entity';
import { ReplacementItem } from './replacement-item.entity';
import { RepairRequest } from './repair-request.entity';

@Entity('computer_components')
export class ComputerComponent {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'FK đến máy tính cha' })
    computerAssetId: string;

    @Column({
        type: 'enum',
        enum: ComponentType,
        comment: 'Loại linh kiện là gì (CPU, RAM, ...)',
    })
    componentType: ComponentType;

    @Column({ comment: 'Tên/Model của linh kiện, vd: Kingston Fury Beast DDR5' })
    name: string;

    @Column({ type: 'text', nullable: true, comment: 'Thông số kỹ thuật chi tiết, vd: 16GB 5200MHz' })
    componentSpecs?: string;

    @Column({ unique: true, nullable: true, comment: 'Số serial của linh kiện nếu có' })
    serialNumber?: string;

    @Column({
        type: 'enum',
        enum: ComponentStatus,
        default: ComponentStatus.INSTALLED,
        comment: 'Trạng thái của linh kiện này',
    })
    status: ComponentStatus;

    @CreateDateColumn({ comment: 'Ngày lắp đặt linh kiện này vào máy' })
    installedAt: Date;

    @Column({ type: 'timestamp', nullable: true, comment: 'Ngày gỡ ra (khi thay thế hoặc hỏng)' })
    removedAt?: Date;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    // Relations
    @ManyToOne(() => Computer, (computer) => computer.components)
    @JoinColumn({ name: 'computerAssetId' })
    computer: Computer;

    @OneToMany(() => ReplacementItem, (item) => item.oldComponent)
    replacementItemsAsOld?: ReplacementItem[];

    @OneToMany(() => ReplacementItem, (item) => item.newlyPurchasedComponent)
    replacementItemsAsNew?: ReplacementItem[];

    @ManyToMany(() => RepairRequest, (repairRequest) => repairRequest.components)
    repairRequests?: RepairRequest[];
}
