import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { AssetSoftware } from './asset-software.entity';

@Entity('software')
export class Software {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text', nullable: true })
  version: string;

  @Column({ type: 'text', nullable: true })
  publisher: string;

  @CreateDateColumn()
  createdAt: Date;

  // Relations
  @OneToMany(() => AssetSoftware, (assetSoftware) => assetSoftware.software)
  assetSoftware?: AssetSoftware[];
}
