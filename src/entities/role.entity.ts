import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { Permission } from "./permission.entity";
import { User } from "./user.entity";

@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ unique: true })
  code: string;

  // Relations
  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: "roles_permissions",
    joinColumn: { name: "roleId", referencedColumnName: "id" },
    inverseJoinColumn: { name: "permissionId", referencedColumnName: "id" },
  })
  permissions?: Permission[];

  @ManyToMany(() => User, (user) => user.roles)
  users?: User[];
}
