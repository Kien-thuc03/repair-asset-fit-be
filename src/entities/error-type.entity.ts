import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    OneToMany,
} from 'typeorm';
import { RepairRequest } from './repair-request.entity';

@Entity('error_types')
export class ErrorType {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true, comment: 'Tên loại lỗi, vd: Lỗi phần mềm, Lỗi màn hình, Lỗi bàn phím' })
    name: string;

    @Column({ type: 'text', nullable: true, comment: 'Mô tả chi tiết về loại lỗi' })
    description?: string;

    @CreateDateColumn()
    createdAt: Date;

    // Relations
    @OneToMany(() => RepairRequest, (repairRequest) => repairRequest.errorType)
    repairRequests?: RepairRequest[];
}
