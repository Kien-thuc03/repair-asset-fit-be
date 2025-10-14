import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { RepairRequest } from './repair-request.entity';

@Entity('file_urls')
export class FileUrl {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column()
  fileSize: number;

  @Column()
  url: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => RepairRequest, repairRequest => repairRequest.attachments)
  @JoinColumn({ name: 'repair_request_id' })
  repairRequest: RepairRequest;

  @Column()
  repairRequestId: string;
}