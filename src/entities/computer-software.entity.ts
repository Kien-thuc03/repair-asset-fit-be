import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
    Unique,
} from 'typeorm';
import { Computer } from './computer.entity';
import { Software } from './software.entity';

@Entity('computer_software')
@Unique('UQ_computer_software_computer_software', ['computerId', 'softwareId'])
@Index('IDX_computer_software_computerId', ['computerId'])
@Index('IDX_computer_software_softwareId', ['softwareId'])
export class ComputerSoftware {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ comment: 'ID của máy tính' })
    computerId: string;

    @Column({ comment: 'ID của phần mềm' })
    softwareId: string;

    @Column({ type: 'date', nullable: true, comment: 'Ngày cài đặt phần mềm' })
    installationDate?: Date;

    @Column({ type: 'text', nullable: true, comment: 'License key hoặc serial của phần mềm' })
    licenseKey?: string;

    @Column({ type: 'text', nullable: true, comment: 'Ghi chú thêm về cài đặt, version notes, etc.' })
    notes?: string;

    @CreateDateColumn({ comment: 'Ngày tạo bản ghi' })
    createdAt: Date;

    @UpdateDateColumn({ comment: 'Ngày cập nhật bản ghi' })
    updatedAt: Date;

    // Relations
    @ManyToOne(() => Computer, (computer) => computer.software, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'computerId' })
    computer: Computer;

    @ManyToOne(() => Software, (software) => software.computerSoftware, {
        onDelete: 'CASCADE',
    })
    @JoinColumn({ name: 'softwareId' })
    software: Software;
}
