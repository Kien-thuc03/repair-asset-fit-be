import {
    Entity,
    Column,
    PrimaryColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Software } from './software.entity';

@Entity('asset_software')
export class AssetSoftware {
    @PrimaryColumn({ comment: 'ID của máy tính' })
    assetId: string;

    @PrimaryColumn({ comment: 'ID của phần mềm' })
    softwareId: string;

    @Column({ type: 'date', nullable: true, comment: 'Ngày cài đặt' })
    installationDate?: Date;

    @Column({ type: 'text', nullable: true, comment: 'Ghi chú, ví dụ: key license' })
    notes?: string;

    // Relations
    @ManyToOne(() => Asset)
    @JoinColumn({ name: 'assetId' })
    asset: Asset;

    @ManyToOne(() => Software)
    @JoinColumn({ name: 'softwareId' })
    software: Software;
}
