import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
} from "typeorm";
import { Role } from "./role.entity";

@Entity("permissions")
export class Permission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: false })
  name: string;

  @Column({ unique: true })
  code: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles?: Role[];
}
