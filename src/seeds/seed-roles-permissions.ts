/**
 * SEED DATA SCRIPT - Roles & Permissions
 * 
 * Script này dùng để import toàn bộ dữ liệu ban đầu từ FE mockData vào database
 * Bao gồm: Permissions, Roles, và Role-Permission relationships
 * 
 * Cách sử dụng:
 * 1. Đảm bảo database đang chạy và có thể kết nối
 * 2. Chạy: npm run seed:roles-permissions
 * 
 * Dữ liệu được seed:
 * - 20 Permissions (các quyền của hệ thống)
 * - 5 Roles (các vai trò trong hệ thống)
 * - Quan hệ giữa Roles và Permissions
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables từ file .env
config({ path: resolve(__dirname, '../../.env') });

// ========== PERMISSIONS DATA (từ FE mockData) ==========
const PERMISSIONS_DATA = [
  // Quyền của Giảng viên
  { name: 'Báo cáo sự cố', code: 'report_issues' },
  { name: 'Theo dõi tiến độ xử lý', code: 'track_progress' },
  { name: 'Tra cứu thiết bị', code: 'search_equipment' },
  { name: 'Xem thông tin cá nhân', code: 'view_personal_info' },

  // Quyền của Kỹ thuật viên
  { name: 'Xử lý báo cáo sự cố', code: 'handle_reports' },
  { name: 'Tạo đề xuất thay thế', code: 'create_replacement_requests' },
  { name: 'Quản lý tài sản', code: 'manage_assets' },
  { name: 'Xem thống kê cá nhân', code: 'view_personal_stats' },

  // Quyền của Tổ trưởng Kỹ thuật
  { name: 'Quản lý kỹ thuật viên', code: 'manage_technicians' },
  { name: 'Phê duyệt đề xuất thay thế', code: 'approve_replacements' },
  { name: 'Lập tờ trình', code: 'create_proposals' },
  { name: 'Xác nhận biên bản', code: 'confirm_reports' },

  // Quyền của Phòng Quản trị
  { name: 'Xử lý tờ trình', code: 'process_proposals' },
  { name: 'Xác minh thiết bị', code: 'verify_equipment' },
  { name: 'Lập biên bản', code: 'create_reports' },
  { name: 'Gửi đề xuất', code: 'submit_requests' },

  // Quyền của QTV Khoa
  { name: 'Quản lý người dùng', code: 'manage_users' },
  { name: 'Phê duyệt cuối cùng', code: 'final_approval' },
  { name: 'Xem báo cáo thống kê', code: 'view_reports' },
  { name: 'Giám sát hệ thống', code: 'system_oversight' },
];

// ========== ROLES DATA (từ FE mockData) ==========
const ROLES_DATA = [
  { name: 'Giảng viên', code: 'GIANG_VIEN' },
  { name: 'Kỹ thuật viên', code: 'KY_THUAT_VIEN' },
  { name: 'Tổ trưởng Kỹ thuật', code: 'TO_TRUONG_KY_THUAT' },
  { name: 'Nhân viên Phòng Quản trị', code: 'PHONG_QUAN_TRI' },
  { name: 'Quản trị viên Khoa', code: 'QTV_KHOA' },
];

// ========== ROLE-PERMISSION MAPPING (từ FE mockData) ==========
const ROLE_PERMISSIONS_MAP = {
  'GIANG_VIEN': [
    'report_issues',
    'track_progress',
    'search_equipment',
    'view_personal_info',
  ],
  'KY_THUAT_VIEN': [
    'handle_reports',
    'create_replacement_requests',
    'manage_assets',
    'view_personal_stats',
  ],
  'TO_TRUONG_KY_THUAT': [
    'manage_technicians',
    'approve_replacements',
    'create_proposals',
    'confirm_reports',
    'handle_reports', // Tổ trưởng cũng có thể xử lý báo cáo
    'create_replacement_requests', // Tổ trưởng cũng có thể tạo đề xuất
  ],
  'PHONG_QUAN_TRI': [
    'process_proposals',
    'verify_equipment',
    'create_reports',
    'submit_requests',
  ],
  'QTV_KHOA': [
    'manage_users',
    'final_approval',
    'view_reports',
    'system_oversight',
  ],
};

// ========== MAIN SEED FUNCTION ==========
async function seedRolesAndPermissions() {
  console.log('🌱 Starting seed script for Roles & Permissions...\n');

  // Create database connection
  const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    // Don't load entities - we'll use raw SQL queries
    entities: [],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await AppDataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = AppDataSource.createQueryRunner();

    // ========== STEP 1: Seed Permissions ==========
    console.log('📝 Step 1: Seeding Permissions...');
    const permissionIds = new Map<string, string>();

    for (const perm of PERMISSIONS_DATA) {
      // Check if permission already exists
      const existing = await queryRunner.manager.query(
        'SELECT id FROM permissions WHERE code = $1',
        [perm.code]
      );

      if (existing.length > 0) {
        console.log(`  ⏭️  Permission '${perm.code}' already exists - skipping`);
        permissionIds.set(perm.code, existing[0].id);
      } else {
        const result = await queryRunner.manager.query(
          'INSERT INTO permissions (name, code, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) RETURNING id',
          [perm.name, perm.code]
        );
        permissionIds.set(perm.code, result[0].id);
        console.log(`  ✅ Created permission: ${perm.name} (${perm.code})`);
      }
    }
    console.log(`\n✨ Seeded ${permissionIds.size} permissions\n`);

    // ========== STEP 2: Seed Roles ==========
    console.log('👥 Step 2: Seeding Roles...');
    const roleIds = new Map<string, string>();

    for (const role of ROLES_DATA) {
      // Check if role already exists
      const existing = await queryRunner.manager.query(
        'SELECT id FROM roles WHERE code = $1',
        [role.code]
      );

      if (existing.length > 0) {
        console.log(`  ⏭️  Role '${role.code}' already exists - skipping`);
        roleIds.set(role.code, existing[0].id);
      } else {
        const result = await queryRunner.manager.query(
          'INSERT INTO roles (name, code, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) RETURNING id',
          [role.name, role.code]
        );
        roleIds.set(role.code, result[0].id);
        console.log(`  ✅ Created role: ${role.name} (${role.code})`);
      }
    }
    console.log(`\n✨ Seeded ${roleIds.size} roles\n`);

    // ========== STEP 3: Assign Permissions to Roles ==========
    console.log('🔗 Step 3: Assigning Permissions to Roles...');

    for (const [roleCode, permissionCodes] of Object.entries(ROLE_PERMISSIONS_MAP)) {
      const roleId = roleIds.get(roleCode);
      if (!roleId) {
        console.log(`  ⚠️  Role '${roleCode}' not found - skipping`);
        continue;
      }

      console.log(`\n  Assigning permissions to ${roleCode}:`);

      for (const permCode of permissionCodes) {
        const permId = permissionIds.get(permCode);
        if (!permId) {
          console.log(`    ⚠️  Permission '${permCode}' not found - skipping`);
          continue;
        }

        // Check if assignment already exists
        const existing = await queryRunner.manager.query(
          'SELECT * FROM role_permissions WHERE "roleId" = $1 AND "permissionId" = $2',
          [roleId, permId]
        );

        if (existing.length > 0) {
          console.log(`    ⏭️  Already assigned: ${permCode}`);
        } else {
          await queryRunner.manager.query(
            'INSERT INTO role_permissions ("roleId", "permissionId") VALUES ($1, $2)',
            [roleId, permId]
          );
          console.log(`    ✅ Assigned: ${permCode}`);
        }
      }
    }

    console.log('\n\n🎉 Seed completed successfully!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('Summary:');
    console.log(`  - ${permissionIds.size} Permissions`);
    console.log(`  - ${roleIds.size} Roles`);
    console.log(`  - Role-Permission relationships configured`);
    console.log('═══════════════════════════════════════════════════════\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

// Run the seed function
seedRolesAndPermissions()
  .then(() => {
    console.log('✅ Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
