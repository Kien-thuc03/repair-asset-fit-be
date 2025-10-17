import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    OneToMany,
    OneToOne,
    Unique,
} from 'typeorm';
import { Asset } from './asset.entity';
import { Room } from './room.entity';
import { ComputerComponent } from './computer-component.entity';

@Entity('computers')
@Unique('unique_room_machine_label', ['roomId', 'machineLabel'])
export class Computer {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, comment: 'ID của tài sản (máy tính)' })
    assetId: string;

    @Column({ comment: 'Vị trí của máy tính này' })
    roomId: string;

    @Column({ comment: 'Số máy' })
    machineLabel: string;

    @Column({ type: 'text', nullable: true })
    notes?: string;

    // Relations
    @OneToOne(() => Asset, (asset) => asset.computer)
    @JoinColumn({ name: 'assetId' })
    asset: Asset;

    @ManyToOne(() => Room)
    @JoinColumn({ name: 'roomId' })
    room: Room;

    @OneToMany(() => ComputerComponent, (component) => component.computer)
    components?: ComputerComponent[];
}
