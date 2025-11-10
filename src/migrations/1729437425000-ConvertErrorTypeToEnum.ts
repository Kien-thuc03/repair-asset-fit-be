import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertErrorTypeToEnum1729437425000 implements MigrationInterface {
  name = 'ConvertErrorTypeToEnum1729437425000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🔍 Checking if migration ConvertErrorTypeToEnum has already been applied...');
    
    // Kiểm tra xem error_types table còn tồn tại không
    const errorTypesExists = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'error_types'
      ) as exists
    `);

    // Kiểm tra xem errorType column đã là enum chưa
    const errorTypeIsEnum = await queryRunner.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'repair_requests' 
        AND column_name = 'errorType'
        AND data_type = 'USER-DEFINED'
      ) as exists
    `);

    // Nếu error_types không tồn tại VÀ errorType đã là enum => migration đã chạy rồi
    if (!errorTypesExists[0].exists && errorTypeIsEnum[0].exists) {
      console.log('✅ Migration already applied - Skipping');
      console.log('   - error_types table: NOT EXISTS (correct)');
      console.log('   - errorType column: IS ENUM (correct)');
      return;
    }

    console.log('⚙️  Applying migration...');

    // 1. Tạo enum type mới
    await queryRunner.query(`
      CREATE TYPE "error_type_enum" AS ENUM (
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

    // 2. Thêm cột mới với enum type
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      ADD COLUMN "errorTypeTemp" "error_type_enum"
    `);

    // 3. Migrate dữ liệu từ errorTypeId sang errorType dựa trên mapping
    // Lấy dữ liệu từ error_types và map sang enum
    await queryRunner.query(`
      UPDATE "repair_requests" r
      SET "errorTypeTemp" = 
        CASE 
          WHEN et.name = 'Máy không khởi động' THEN 'Máy không khởi động'::"error_type_enum"
          WHEN et.name = 'Máy hư phần mềm' THEN 'Máy hư phần mềm'::"error_type_enum"
          WHEN et.name = 'Máy hư bàn phím' THEN 'Máy hư bàn phím'::"error_type_enum"
          WHEN et.name = 'Máy hư chuột' THEN 'Máy hư chuột'::"error_type_enum"
          WHEN et.name = 'Máy không sử dụng được' THEN 'Máy không sử dụng được'::"error_type_enum"
          WHEN et.name = 'Máy không kết nối mạng' THEN 'Máy không kết nối mạng'::"error_type_enum"
          WHEN et.name = 'Máy hư màn hình' OR et.name = 'Màn hình hư' THEN 'Máy hư màn hình'::"error_type_enum"
          WHEN et.name = 'Máy mất chuột' THEN 'Máy mất chuột'::"error_type_enum"
          WHEN et.name = 'Máy mất bàn phím' THEN 'Máy mất bàn phím'::"error_type_enum"
          ELSE 'Lỗi khác'::"error_type_enum"
        END
      FROM "error_types" et
      WHERE r."errorTypeId" = et.id AND r."errorTypeId" IS NOT NULL
    `);

    // 4. Xóa foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      DROP CONSTRAINT IF EXISTS "FK_repair_requests_error_types"
    `);

    // 5. Xóa cột cũ errorTypeId
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      DROP COLUMN "errorTypeId"
    `);

    // 6. Đổi tên cột mới thành errorType
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      RENAME COLUMN "errorTypeTemp" TO "errorType"
    `);

    // 7. Xóa bảng error_types (không còn cần thiết)
    await queryRunner.query(`
      DROP TABLE IF EXISTS "error_types" CASCADE
    `);

    console.log('✅ Migration completed: Converted ErrorType from table to enum');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. Tạo lại bảng error_types
    await queryRunner.query(`
      CREATE TABLE "error_types" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "name" character varying NOT NULL UNIQUE,
        "description" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now()
      )
    `);

    // 2. Insert lại các error types
    await queryRunner.query(`
      INSERT INTO "error_types" ("name", "description") VALUES
        ('Máy không khởi động', 'Máy tính không thể khởi động, không có tín hiệu, hoặc không vào được BIOS'),
        ('Máy hư phần mềm', 'Lỗi hệ điều hành, phần mềm ứng dụng, hoặc driver'),
        ('Máy hư bàn phím', 'Bàn phím không hoạt động, một số phím không nhấn được'),
        ('Máy hư chuột', 'Chuột không hoạt động, con trỏ không di chuyển'),
        ('Máy không sử dụng được', 'Máy tính không thể sử dụng được do nhiều lý do'),
        ('Máy không kết nối mạng', 'Máy không thể kết nối internet hoặc mạng LAN'),
        ('Máy hư màn hình', 'Màn hình không hiển thị, hiển thị sai màu, hoặc bị vỡ'),
        ('Máy mất chuột', 'Chuột bị mất, cần thay thế chuột mới'),
        ('Máy mất bàn phím', 'Bàn phím bị mất, cần thay thế bàn phím mới'),
        ('Lỗi khác', 'Các lỗi khác không thuộc danh mục trên')
    `);

    // 3. Thêm cột errorTypeId vào repair_requests
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      ADD COLUMN "errorTypeId" uuid
    `);

    // 4. Migrate dữ liệu ngược lại từ enum sang foreign key
    await queryRunner.query(`
      UPDATE "repair_requests" r
      SET "errorTypeId" = et.id
      FROM "error_types" et
      WHERE r."errorType" IS NOT NULL 
        AND et.name = r."errorType"::text
    `);

    // 5. Thêm foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      ADD CONSTRAINT "FK_repair_requests_error_types" 
      FOREIGN KEY ("errorTypeId") REFERENCES "error_types"("id")
    `);

    // 6. Xóa cột errorType
    await queryRunner.query(`
      ALTER TABLE "repair_requests" 
      DROP COLUMN "errorType"
    `);

    // 7. Xóa enum type
    await queryRunner.query(`
      DROP TYPE IF EXISTS "error_type_enum"
    `);

    console.log('✅ Migration rolled back: Reverted ErrorType from enum to table');
  }
}
