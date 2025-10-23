import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIdToPrimaryKeyTechnicianAssignment1729584000000 implements MigrationInterface {
    name = 'AddIdToPrimaryKeyTechnicianAssignment1729584000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Bước 1: Thêm cột ID mới
        await queryRunner.query(`
            ALTER TABLE "technician_assignments"
            ADD COLUMN "id" UUID DEFAULT gen_random_uuid() NOT NULL
        `);

        // Bước 2: Xóa Primary Key cũ
        await queryRunner.query(`
            ALTER TABLE "technician_assignments" 
            DROP CONSTRAINT "PK_aabb443f0a4437c9abd9d00f3cd"
        `);

        // Bước 3: Tạo Primary Key mới với cột ID
        await queryRunner.query(`
            ALTER TABLE "technician_assignments"
            ADD CONSTRAINT "PK_technician_assignments" PRIMARY KEY ("id")
        `);

        // Bước 4: Thêm UNIQUE constraint cho business logic
        // Đảm bảo không trùng lặp (technicianId, building, floor)
        await queryRunner.query(`
            CREATE UNIQUE INDEX "UQ_technician_building_floor"
            ON "technician_assignments" ("technicianId", "building", COALESCE("floor", '__ALL__'))
        `);

        // Bước 5: Thêm index cho tối ưu query
        await queryRunner.query(`
            CREATE INDEX "IDX_technician_assignments_technician"
            ON "technician_assignments" ("technicianId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_technician_assignments_building"
            ON "technician_assignments" ("building")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_technician_assignments_building_floor"
            ON "technician_assignments" ("building", "floor")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Rollback: Xóa các index
        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_technician_assignments_building_floor"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_technician_assignments_building"
        `);

        await queryRunner.query(`
            DROP INDEX IF EXISTS "IDX_technician_assignments_technician"
        `);

        // Xóa UNIQUE constraint
        await queryRunner.query(`
            DROP INDEX IF EXISTS "UQ_technician_building_floor"
        `);

        // Xóa Primary Key mới
        await queryRunner.query(`
            ALTER TABLE "technician_assignments" 
            DROP CONSTRAINT "PK_technician_assignments"
        `);

        // Khôi phục Primary Key cũ
        await queryRunner.query(`
            ALTER TABLE "technician_assignments"
            ADD CONSTRAINT "PK_aabb443f0a4437c9abd9d00f3cd"
            PRIMARY KEY ("technicianId", "building")
        `);

        // Xóa cột ID
        await queryRunner.query(`
            ALTER TABLE "technician_assignments" 
            DROP COLUMN "id"
        `);
    }
}
