import { MigrationInterface, QueryRunner, Table, TableColumn, TableForeignKey, TableIndex } from "typeorm";

export class AddRolesAndPermissions1729000000000 implements MigrationInterface {
    name = 'AddRolesAndPermissions1729000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Create permissions table
        await queryRunner.createTable(
            new Table({
                name: "permissions",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        isNullable: false,
                    },
                    {
                        name: "code",
                        type: "varchar",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "deletedAt",
                        type: "timestamp",
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        // 2. Create roles table
        await queryRunner.createTable(
            new Table({
                name: "roles",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "code",
                        type: "varchar",
                        isUnique: true,
                        isNullable: false,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                    {
                        name: "deletedAt",
                        type: "timestamp",
                        isNullable: true,
                    },
                ],
            }),
            true
        );

        // 3. Create role_permissions join table
        await queryRunner.createTable(
            new Table({
                name: "role_permissions",
                columns: [
                    {
                        name: "roleId",
                        type: "uuid",
                        isPrimary: true,
                    },
                    {
                        name: "permissionId",
                        type: "uuid",
                        isPrimary: true,
                    },
                ],
            }),
            true
        );

        // 4. Create user_roles join table
        await queryRunner.createTable(
            new Table({
                name: "user_roles",
                columns: [
                    {
                        name: "userId",
                        type: "uuid",
                        isPrimary: true,
                    },
                    {
                        name: "roleId",
                        type: "uuid",
                        isPrimary: true,
                    },
                ],
            }),
            true
        );

        // 5. Add new columns to users table
        await queryRunner.addColumn(
            "users",
            new TableColumn({
                name: "fullName",
                type: "varchar",
                isNullable: false,
                default: "''",
            })
        );

        await queryRunner.addColumn(
            "users",
            new TableColumn({
                name: "phoneNumber",
                type: "varchar",
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            "users",
            new TableColumn({
                name: "birthDate",
                type: "date",
                isNullable: true,
            })
        );

        await queryRunner.addColumn(
            "users",
            new TableColumn({
                name: "status",
                type: "enum",
                enum: ["ACTIVE", "INACTIVE", "LOCKED", "DELETED"],
                default: "'ACTIVE'",
                isNullable: false,
            })
        );

        await queryRunner.addColumn(
            "users",
            new TableColumn({
                name: "deletedAt",
                type: "timestamp",
                isNullable: true,
            })
        );

        // 6. Make firstName and lastName nullable (if needed)
        await queryRunner.changeColumn(
            "users",
            "firstName",
            new TableColumn({
                name: "firstName",
                type: "varchar",
                isNullable: true,
            })
        );

        await queryRunner.changeColumn(
            "users",
            "lastName",
            new TableColumn({
                name: "lastName",
                type: "varchar",
                isNullable: true,
            })
        );

        // 7. Add foreign keys
        await queryRunner.createForeignKey(
            "role_permissions",
            new TableForeignKey({
                columnNames: ["roleId"],
                referencedColumnNames: ["id"],
                referencedTableName: "roles",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "role_permissions",
            new TableForeignKey({
                columnNames: ["permissionId"],
                referencedColumnNames: ["id"],
                referencedTableName: "permissions",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "user_roles",
            new TableForeignKey({
                columnNames: ["userId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "user_roles",
            new TableForeignKey({
                columnNames: ["roleId"],
                referencedColumnNames: ["id"],
                referencedTableName: "roles",
                onDelete: "CASCADE",
            })
        );

        // 8. Create indexes for better performance
        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "IDX_USERS_USERNAME",
                columnNames: ["username"],
            })
        );

        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "IDX_USERS_EMAIL",
                columnNames: ["email"],
            })
        );

        await queryRunner.createIndex(
            "users",
            new TableIndex({
                name: "IDX_USERS_STATUS",
                columnNames: ["status"],
            })
        );

        await queryRunner.createIndex(
            "roles",
            new TableIndex({
                name: "IDX_ROLES_CODE",
                columnNames: ["code"],
            })
        );

        await queryRunner.createIndex(
            "permissions",
            new TableIndex({
                name: "IDX_PERMISSIONS_CODE",
                columnNames: ["code"],
            })
        );

        // 9. Migrate existing data - Update fullName from firstName + lastName
        await queryRunner.query(`
            UPDATE users 
            SET "fullName" = CONCAT(COALESCE("firstName", ''), ' ', COALESCE("lastName", ''))
            WHERE "fullName" = ''
        `);

        // 10. Update status based on isActive
        await queryRunner.query(`
            UPDATE users 
            SET status = CASE 
                WHEN "isActive" = true THEN 'ACTIVE'::text
                ELSE 'INACTIVE'::text
            END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.dropIndex("permissions", "IDX_PERMISSIONS_CODE");
        await queryRunner.dropIndex("roles", "IDX_ROLES_CODE");
        await queryRunner.dropIndex("users", "IDX_USERS_STATUS");
        await queryRunner.dropIndex("users", "IDX_USERS_EMAIL");
        await queryRunner.dropIndex("users", "IDX_USERS_USERNAME");

        // Drop foreign keys
        const userRolesTable = await queryRunner.getTable("user_roles");
        const rolePermissionsTable = await queryRunner.getTable("role_permissions");

        if (userRolesTable) {
            const userRolesForeignKeys = userRolesTable.foreignKeys;
            for (const foreignKey of userRolesForeignKeys) {
                await queryRunner.dropForeignKey("user_roles", foreignKey);
            }
        }

        if (rolePermissionsTable) {
            const rolePermissionsForeignKeys = rolePermissionsTable.foreignKeys;
            for (const foreignKey of rolePermissionsForeignKeys) {
                await queryRunner.dropForeignKey("role_permissions", foreignKey);
            }
        }

        // Drop tables
        await queryRunner.dropTable("user_roles");
        await queryRunner.dropTable("role_permissions");
        await queryRunner.dropTable("roles");
        await queryRunner.dropTable("permissions");

        // Drop new columns from users table
        await queryRunner.dropColumn("users", "deletedAt");
        await queryRunner.dropColumn("users", "status");
        await queryRunner.dropColumn("users", "birthDate");
        await queryRunner.dropColumn("users", "phoneNumber");
        await queryRunner.dropColumn("users", "fullName");

        // Revert firstName and lastName to NOT NULL (if they were)
        await queryRunner.changeColumn(
            "users",
            "firstName",
            new TableColumn({
                name: "firstName",
                type: "varchar",
                isNullable: false,
            })
        );

        await queryRunner.changeColumn(
            "users",
            "lastName",
            new TableColumn({
                name: "lastName",
                type: "varchar",
                isNullable: false,
            })
        );
    }
}
