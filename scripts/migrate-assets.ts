#!/usr/bin/env ts-node

/**
 * CLI Script để migrate assets sang computers và computer_components
 * 
 * Usage:
 *   npm run migrate:assets              # Migrate tất cả
 *   npm run migrate:assets -- --category <id>  # Migrate theo category
 *   npm run migrate:assets -- --rollback       # Rollback (xóa tất cả)
 */

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AssetsMigrationService } from '../src/modules/assets/assets-migration.service';

async function main() {
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║     ASSET MIGRATION CLI - Computer & Components           ║');
  console.log('╚════════════════════════════════════════════════════════════╝\n');

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['log', 'error', 'warn'],
  });

  const migrationService = app.get(AssetsMigrationService);

  // Parse command line arguments
  const args = process.argv.slice(2);
  const isRollback = args.includes('--rollback');
  const categoryIndex = args.indexOf('--category');
  const categoryIds = categoryIndex !== -1 && args[categoryIndex + 1]
    ? [args[categoryIndex + 1]]
    : undefined;

  try {
    if (isRollback) {
      // Rollback mode
      console.log('⚠️  MODE: ROLLBACK');
      console.log('Bạn có chắc chắn muốn XÓA TẤT CẢ dữ liệu đã migrate?');
      console.log('Nhấn Ctrl+C để hủy, hoặc đợi 5 giây để tiếp tục...\n');

      await new Promise(resolve => setTimeout(resolve, 5000));

      const result = await migrationService.rollbackMigration();

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║                 ROLLBACK COMPLETED                     ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log(`🗑️  Đã xóa ${result.deletedComputers} computers`);
      console.log(`🗑️  Đã xóa ${result.deletedComponents} components`);

    } else {
      // Migration mode
      console.log('🚀 MODE: MIGRATION');
      if (categoryIds) {
        console.log(`📂 Filter: Category IDs = ${categoryIds.join(', ')}`);
      } else {
        console.log('📂 Filter: Tất cả assets là máy tính');
      }
      console.log('');

      const result = await migrationService.migrateAllComputerAssets(categoryIds);

      console.log('\n╔════════════════════════════════════════════════════════╗');
      console.log('║                  MIGRATION SUMMARY                     ║');
      console.log('╚════════════════════════════════════════════════════════╝');
      console.log(`📊 Tổng số assets:    ${result.total}`);
      console.log(`✅ Migrate thành công: ${result.success}`);
      console.log(`⏭️  Bỏ qua:            ${result.skipped}`);
      console.log(`❌ Thất bại:           ${result.failed}`);
      console.log('');

      if (result.success > 0) {
        console.log('💡 Tip: Kiểm tra kết quả trong database:');
        console.log('   SELECT * FROM computers LIMIT 10;');
        console.log('   SELECT * FROM computer_components LIMIT 10;');
      }

      if (result.failed > 0) {
        console.log('\n⚠️  Một số assets migrate thất bại. Kiểm tra logs để biết chi tiết.');
      }
    }

  } catch (error) {
    console.error('\n❌ LỖI NGHIÊM TRỌNG:', error);
    process.exit(1);
  } finally {
    await app.close();
  }

  console.log('\n✨ Done!\n');
  process.exit(0);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
