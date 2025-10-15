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
import { Unit } from './unit.entity';
import { Room } from './room.entity';
import { User } from './user.entity';
import { TransactionType } from 'src/common/shared/TransactionType';
import { TransactionStatus } from 'src/common/shared/TransactionStatus';
import { AssetTransactionItem } from './asset-transaction-item.entity';

@Entity('assetTransactions')
export class AssetTransaction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: TransactionType,
    nullable: true,
  })
  type: TransactionType;

  @Column({ name: 'fromUnitId', nullable: true })
  fromUnitId: string;

  @Column({ name: 'toUnitId', nullable: true })
  toUnitId: string;

  @Column({ name: 'fromRoomId', nullable: true })
  fromRoomId: string;

  @Column({ name: 'toRoomId', nullable: true })
  toRoomId: string;

  @Column({ name: 'createdBy', nullable: true })
  createdBy: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ name: 'approvedBy', nullable: true })
  approvedBy: string;

  @Column({ type: 'timestamp', nullable: true, name: 'approvedAt' })
  approvedAt: Date;

  @Column({
    type: 'enum',
    enum: TransactionStatus,
    nullable: true,
  })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  note: string;

  // Relations
  @ManyToOne(() => Unit, { nullable: true })
  @JoinColumn({ name: 'fromUnitId' })
  fromUnit?: Unit;

  @ManyToOne(() => Unit, { nullable: true })
  @JoinColumn({ name: 'toUnitId' })
  toUnit?: Unit;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'fromRoomId' })
  fromRoom?: Room;

  @ManyToOne(() => Room, { nullable: true })
  @JoinColumn({ name: 'toRoomId' })
  toRoom?: Room;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'approvedBy' })
  approver?: User;

  @OneToMany(() => AssetTransactionItem, (item) => item.transaction)
  items?: AssetTransactionItem[];
}
