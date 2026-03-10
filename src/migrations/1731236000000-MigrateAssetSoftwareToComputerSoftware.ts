import { MigrationInterface, QueryRunner } from 'typeorm';

export class MigrateAssetSoftwareToComputerSoftware1731236000000 implements MigrationInterface {
  name = 'MigrateAssetSoftwareToComputerSoftware1731236000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('🚀 Starting migration: Asset Software → Computer Software');
    
    // ============================================
    // BƯỚC 1: KIỂM TRA DỮ LIỆU TRƯỚC KHI MIGRATE
    // ============================================
    console.log('\n📊 Step 1: Validating data integrity...');
    
    // Kiểm tra số lượng bản ghi hiện tại
    const assetSoftwareCount = await queryRunner.query(`
      SELECT COUNT(*) as count FROM asset_software
    `);
    console.log(`   - Total asset_software records: ${assetSoftwareCount[0].count}`);

    // Kiểm tra có bản ghi nào không có computer tương ứng không
    const orphanRecords = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM asset_software aso
      WHERE NOT EXISTS (
        SELECT 1 FROM computers c WHERE c."assetId" = aso."assetId"
      )
    `);
    
    if (parseInt(orphanRecords[0].count) > 0) {
      console.warn(`   ⚠️  WARNING: Found ${orphanRecords[0].count} asset_software records without corresponding computer!`);
      console.warn('   These records will be skipped during migration.');
      
      // Hiển thị chi tiết các bản ghi orphan
      const orphanDetails = await queryRunner.query(`
        SELECT aso."assetId", aso."softwareId", a.kt_code, a.name
        FROM asset_software aso
        LEFT JOIN assets a ON a.id = aso."assetId"
        WHERE NOT EXISTS (
          SELECT 1 FROM computers c WHERE c."assetId" = aso."assetId"
        )
        LIMIT 5
      `);
      console.warn('   Sample orphan records:', orphanDetails);
    } else {
      console.log('   ✅ All asset_software records have corresponding computers');
    }

    // ============================================
    // BƯỚC 2: TẠO BẢNG COMPUTER_SOFTWARE MỚI
    // ============================================
    console.log('\n📦 Step 2: Creating computer_software table...');
    
    await queryRunner.query(`
      CREATE TABLE "computer_software" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "computerId" uuid NOT NULL,
        "softwareId" uuid NOT NULL,
        "installationDate" date,
        "licenseKey" text,
        "notes" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_computer_software" PRIMARY KEY ("id")
      )
    `);
    console.log('   ✅ Table computer_software created');

    // Tạo unique constraint để tránh duplicate
    await queryRunner.query(`
      ALTER TABLE "computer_software" 
      ADD CONSTRAINT "UQ_computer_software_computer_software" 
      UNIQUE ("computerId", "softwareId")
    `);
    console.log('   ✅ Unique constraint added');

    // Tạo indexes để tối ưu query performance
    await queryRunner.query(`
      CREATE INDEX "IDX_computer_software_computerId" 
      ON "computer_software" ("computerId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_computer_software_softwareId" 
      ON "computer_software" ("softwareId")
    `);
    console.log('   ✅ Indexes created');

    // ============================================
    // BƯỚC 3: MIGRATE DỮ LIỆU
    // ============================================
    console.log('\n🔄 Step 3: Migrating data from asset_software to computer_software...');
    
    const migratedRows = await queryRunner.query(`
      INSERT INTO "computer_software" (
        "computerId", 
        "softwareId", 
        "installationDate", 
        "notes",
        "createdAt",
        "updatedAt"
      )
      SELECT 
        c.id as "computerId",
        aso."softwareId",
        aso."installationDate",
        aso.notes,
        now() as "createdAt",
        now() as "updatedAt"
      FROM asset_software aso
      INNER JOIN computers c ON c."assetId" = aso."assetId"
      ON CONFLICT ("computerId", "softwareId") DO NOTHING
      RETURNING id
    `);
    console.log(`   ✅ Migrated ${migratedRows.length} records successfully`);

    // Verify migration
    const computerSoftwareCount = await queryRunner.query(`
      SELECT COUNT(*) as count FROM computer_software
    `);
    console.log(`   📊 Total computer_software records after migration: ${computerSoftwareCount[0].count}`);

    // ============================================
    // BƯỚC 4: TẠO FOREIGN KEY CONSTRAINTS
    // ============================================
    console.log('\n🔗 Step 4: Creating foreign key constraints...');
    
    await queryRunner.query(`
      ALTER TABLE "computer_software" 
      ADD CONSTRAINT "FK_computer_software_computer" 
      FOREIGN KEY ("computerId") 
      REFERENCES "computers"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
    console.log('   ✅ Foreign key to computers created');

    await queryRunner.query(`
      ALTER TABLE "computer_software" 
      ADD CONSTRAINT "FK_computer_software_software" 
      FOREIGN KEY ("softwareId") 
      REFERENCES "software"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
    console.log('   ✅ Foreign key to software created');

    // ============================================
    // BƯỚC 5: XÁC MINH DỮ LIỆU
    // ============================================
    console.log('\n✅ Step 5: Verifying migrated data...');
    
    // So sánh số lượng trước và sau migration
    const validRecordsCount = await queryRunner.query(`
      SELECT COUNT(*) as count 
      FROM asset_software aso
      WHERE EXISTS (
        SELECT 1 FROM computers c WHERE c."assetId" = aso."assetId"
      )
    `);
    
    const expectedCount = parseInt(validRecordsCount[0].count);
    const actualCount = parseInt(computerSoftwareCount[0].count);
    
    if (expectedCount === actualCount) {
      console.log(`   ✅ Data verification PASSED: ${actualCount} records migrated correctly`);
    } else {
      console.warn(`   ⚠️  Data verification WARNING:`);
      console.warn(`      Expected: ${expectedCount} records`);
      console.warn(`      Actual: ${actualCount} records`);
      console.warn(`      Difference: ${Math.abs(expectedCount - actualCount)} records`);
    }

    // Lấy sample data để verify
    const sampleData = await queryRunner.query(`
      SELECT 
        cs.id,
        c."machineLabel",
        s.name as software_name,
        cs."installationDate",
        cs.notes
      FROM computer_software cs
      JOIN computers c ON c.id = cs."computerId"
      JOIN software s ON s.id = cs."softwareId"
      LIMIT 3
    `);
    console.log('\n   📋 Sample migrated data:');
    sampleData.forEach((row: any, index: number) => {
      console.log(`      ${index + 1}. Machine ${row.machineLabel}: ${row.software_name} (${row.installationDate || 'No date'})`);
    });

    // ============================================
    // BƯỚC 6: XÓA BẢNG ASSET_SOFTWARE CŨ
    // ============================================
    console.log('\n🗑️  Step 6: Dropping old asset_software table...');
    
    // Drop foreign key constraints trước
    await queryRunner.query(`
      ALTER TABLE "asset_software" 
      DROP CONSTRAINT IF EXISTS "FK_12de2c1106c7a45bb6130b85255"
    `);
    await queryRunner.query(`
      ALTER TABLE "asset_software" 
      DROP CONSTRAINT IF EXISTS "FK_3ad0c72035616b8c271bc7b3bd6"
    `);
    console.log('   ✅ Foreign key constraints dropped');

    // Drop table
    await queryRunner.query(`
      DROP TABLE "asset_software"
    `);
    console.log('   ✅ Table asset_software dropped');

    // ============================================
    // HOÀN THÀNH
    // ============================================
    console.log('\n🎉 Migration completed successfully!');
    console.log('=' .repeat(60));
    console.log(`✅ Created: computer_software table`);
    console.log(`✅ Migrated: ${actualCount} records`);
    console.log(`✅ Deleted: asset_software table`);
    console.log(`✅ Preserved: software table (needed for software_proposals)`);
    console.log('=' .repeat(60));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    console.log('🔄 Rolling back migration: Computer Software → Asset Software');
    
    // ============================================
    // BƯỚC 1: TẠO LẠI BẢNG ASSET_SOFTWARE
    // ============================================
    console.log('\n📦 Step 1: Recreating asset_software table...');
    
    await queryRunner.query(`
      CREATE TABLE "asset_software" (
        "assetId" uuid NOT NULL,
        "softwareId" uuid NOT NULL,
        "installationDate" date,
        "notes" text,
        CONSTRAINT "PK_asset_software" PRIMARY KEY ("assetId", "softwareId")
      )
    `);
    console.log('   ✅ Table asset_software recreated');

    // ============================================
    // BƯỚC 2: MIGRATE DỮ LIỆU NGƯỢC LẠI
    // ============================================
    console.log('\n🔄 Step 2: Migrating data back from computer_software to asset_software...');
    
    const migratedRows = await queryRunner.query(`
      INSERT INTO "asset_software" (
        "assetId", 
        "softwareId", 
        "installationDate", 
        "notes"
      )
      SELECT 
        c."assetId",
        cs."softwareId",
        cs."installationDate",
        cs.notes
      FROM computer_software cs
      INNER JOIN computers c ON c.id = cs."computerId"
      ON CONFLICT ("assetId", "softwareId") DO NOTHING
      RETURNING "assetId"
    `);
    console.log(`   ✅ Migrated ${migratedRows.length} records back`);

    // ============================================
    // BƯỚC 3: TẠO LẠI FOREIGN KEY CONSTRAINTS
    // ============================================
    console.log('\n🔗 Step 3: Recreating foreign key constraints...');
    
    await queryRunner.query(`
      ALTER TABLE "asset_software" 
      ADD CONSTRAINT "FK_3ad0c72035616b8c271bc7b3bd6" 
      FOREIGN KEY ("assetId") 
      REFERENCES "assets"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
    
    await queryRunner.query(`
      ALTER TABLE "asset_software" 
      ADD CONSTRAINT "FK_12de2c1106c7a45bb6130b85255" 
      FOREIGN KEY ("softwareId") 
      REFERENCES "software"("id") 
      ON DELETE CASCADE 
      ON UPDATE NO ACTION
    `);
    console.log('   ✅ Foreign key constraints recreated');

    // ============================================
    // BƯỚC 4: XÓA BẢNG COMPUTER_SOFTWARE
    // ============================================
    console.log('\n🗑️  Step 4: Dropping computer_software table...');
    
    await queryRunner.query(`
      ALTER TABLE "computer_software" 
      DROP CONSTRAINT IF EXISTS "FK_computer_software_computer"
    `);
    await queryRunner.query(`
      ALTER TABLE "computer_software" 
      DROP CONSTRAINT IF EXISTS "FK_computer_software_software"
    `);
    
    await queryRunner.query(`
      DROP TABLE "computer_software"
    `);
    console.log('   ✅ Table computer_software dropped');

    // ============================================
    // HOÀN THÀNH ROLLBACK
    // ============================================
    console.log('\n✅ Rollback completed successfully!');
    console.log('=' .repeat(60));
    console.log(`✅ Recreated: asset_software table`);
    console.log(`✅ Migrated back: ${migratedRows.length} records`);
    console.log(`✅ Deleted: computer_software table`);
    console.log('=' .repeat(60));
  }
}
