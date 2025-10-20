import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateErrorTypeEnumToConstantCase1729437426000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Bước 1: Tạo enum mới với giá trị CONSTANT_CASE
    await queryRunner.query(`
      CREATE TYPE "error_type_enum_new" AS ENUM (
        'MAY_KHONG_KHOI_DONG',
        'MAY_HU_PHAN_MEM',
        'MAY_HU_BAN_PHIM',
        'MAY_HU_CHUOT',
        'MAY_KHONG_SU_DUNG_DUOC',
        'MAY_KHONG_KET_NOI_MANG',
        'MAY_HU_MAN_HINH',
        'MAY_MAT_CHUOT',
        'MAY_MAT_BAN_PHIM',
        'LOI_KHAC'
      )
    `);

    // Bước 2: Thêm cột tạm với enum mới
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      ADD COLUMN "errorTypeTemp" "error_type_enum_new"
    `);

    // Bước 3: Migrate dữ liệu từ giá trị tiếng Việt sang CONSTANT_CASE
    await queryRunner.query(`
      UPDATE "repair_requests"
      SET "errorTypeTemp" = 
        CASE "errorType"::text
          WHEN 'Máy không khởi động' THEN 'MAY_KHONG_KHOI_DONG'::error_type_enum_new
          WHEN 'Máy hư phần mềm' THEN 'MAY_HU_PHAN_MEM'::error_type_enum_new
          WHEN 'Máy hư bàn phím' THEN 'MAY_HU_BAN_PHIM'::error_type_enum_new
          WHEN 'Máy hư chuột' THEN 'MAY_HU_CHUOT'::error_type_enum_new
          WHEN 'Máy không sử dụng được' THEN 'MAY_KHONG_SU_DUNG_DUOC'::error_type_enum_new
          WHEN 'Máy không kết nối mạng' THEN 'MAY_KHONG_KET_NOI_MANG'::error_type_enum_new
          WHEN 'Máy hư màn hình' THEN 'MAY_HU_MAN_HINH'::error_type_enum_new
          WHEN 'Máy mất chuột' THEN 'MAY_MAT_CHUOT'::error_type_enum_new
          WHEN 'Máy mất bàn phím' THEN 'MAY_MAT_BAN_PHIM'::error_type_enum_new
          WHEN 'Lỗi khác' THEN 'LOI_KHAC'::error_type_enum_new
          ELSE NULL
        END
      WHERE "errorType" IS NOT NULL
    `);

    // Bước 4: Xóa cột cũ
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      DROP COLUMN "errorType"
    `);

    // Bước 5: Đổi tên cột tạm thành errorType
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      RENAME COLUMN "errorTypeTemp" TO "errorType"
    `);

    // Bước 6: Xóa enum cũ
    await queryRunner.query(`
      DROP TYPE "error_type_enum"
    `);

    // Bước 7: Đổi tên enum mới thành tên cũ
    await queryRunner.query(`
      ALTER TYPE "error_type_enum_new" RENAME TO "error_type_enum"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Bước 1: Tạo lại enum cũ với giá trị tiếng Việt
    await queryRunner.query(`
      CREATE TYPE "error_type_enum_old" AS ENUM (
        'Máy không khởi động',
        'Máy hư phần mềm',
        'Máy hư bàn phím',
        'Máy hư chuột',
        'Máy không sử dụng được',
        'Máy không kết nối mạng',
        'Máy hư màn hình',
        'Máy mất chuột',
        'Máy mất bàn phím',
        'Lỗi khác'
      )
    `);

    // Bước 2: Thêm cột tạm với enum cũ
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      ADD COLUMN "errorTypeTemp" "error_type_enum_old"
    `);

    // Bước 3: Migrate dữ liệu ngược lại
    await queryRunner.query(`
      UPDATE "repair_requests"
      SET "errorTypeTemp" = 
        CASE "errorType"::text
          WHEN 'MAY_KHONG_KHOI_DONG' THEN 'Máy không khởi động'::error_type_enum_old
          WHEN 'MAY_HU_PHAN_MEM' THEN 'Máy hư phần mềm'::error_type_enum_old
          WHEN 'MAY_HU_BAN_PHIM' THEN 'Máy hư bàn phím'::error_type_enum_old
          WHEN 'MAY_HU_CHUOT' THEN 'Máy hư chuột'::error_type_enum_old
          WHEN 'MAY_KHONG_SU_DUNG_DUOC' THEN 'Máy không sử dụng được'::error_type_enum_old
          WHEN 'MAY_KHONG_KET_NOI_MANG' THEN 'Máy không kết nối mạng'::error_type_enum_old
          WHEN 'MAY_HU_MAN_HINH' THEN 'Máy hư màn hình'::error_type_enum_old
          WHEN 'MAY_MAT_CHUOT' THEN 'Máy mất chuột'::error_type_enum_old
          WHEN 'MAY_MAT_BAN_PHIM' THEN 'Máy mất bàn phím'::error_type_enum_old
          WHEN 'LOI_KHAC' THEN 'Lỗi khác'::error_type_enum_old
          ELSE NULL
        END
      WHERE "errorType" IS NOT NULL
    `);

    // Bước 4: Xóa cột errorType hiện tại
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      DROP COLUMN "errorType"
    `);

    // Bước 5: Đổi tên cột tạm thành errorType
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      RENAME COLUMN "errorTypeTemp" TO "errorType"
    `);

    // Bước 6: Xóa enum CONSTANT_CASE
    await queryRunner.query(`
      DROP TYPE "error_type_enum"
    `);

    // Bước 7: Đổi tên enum cũ thành tên chính
    await queryRunner.query(`
      ALTER TYPE "error_type_enum_old" RENAME TO "error_type_enum"
    `);
  }
}
