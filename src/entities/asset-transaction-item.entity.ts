import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AssetTransaction } from './asset-transaction.entity';
import { Asset } from './asset.entity';

@Entity('assetTransactionItems')
export class AssetTransactionItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'transactionId', nullable: true })
  transactionId: string;

  @Column({ name: 'assetId', nullable: true })
  assetId: string;

  @Column({ type: 'text', nullable: true })
  note: string;

  // Relations
  @ManyToOne(() => AssetTransaction, (transaction) => transaction.items, { nullable: true })
  @JoinColumn({ name: 'transactionId' })
  transaction?: AssetTransaction;

  @ManyToOne(() => Asset, { nullable: true })
  @JoinColumn({ name: 'assetId' })
  asset?: Asset;
}
