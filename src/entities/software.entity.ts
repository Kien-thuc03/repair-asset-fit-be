import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToMany,
    OneToMany,
    UpdateDateColumn,
    DeleteDateColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { SoftwareProposalItem } from './software-proposal-item.entity';

@Entity('software')
export class Software {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'Tên phần mềm, vd: Microsoft Office 2021, AutoCAD 2024' })
    name: string;

    @Column({ nullable: true, comment: 'Phiên bản phần mềm' })
    version?: string;

    @Column({ nullable: true, comment: 'Nhà sản xuất' })
    publisher?: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt?: Date;

    // Relations
    @ManyToMany(() => Asset, (asset) => asset.software)
    assets?: Asset[];

    @OneToMany(() => SoftwareProposalItem, (item) => item.newlyAcquiredSoftware)
    proposalItems?: SoftwareProposalItem[];
}
