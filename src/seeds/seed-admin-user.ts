/**
 * SEED DATA SCRIPT - Admin User
 * 
 * Script này tạo một user admin với thông tin:
 * - Username: 21012345
 * - Password: admin123
 * - Full Name: Admin
 * - Roles: TẤT CẢ các roles trong hệ thống (5 roles)
 * 
 * Cách chạy:
 * 1. Đảm bảo database đã được khởi động: docker-compose up -d
 * 2. Chạy: pnpm run seed:admin-user
 * 
 * Lưu ý: Script sẽ tự động cập nhật roles nếu user đã tồn tại
 */

import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables từ file .env
config({ path: resolve(__dirname, '../../.env') });

// ========== MAIN SEED FUNCTION ==========
async function seedAdminUser() {
  console.log('🌱 Starting seed script for Admin User...\n');

  // Kết nối database
  const dataSource = new DataSource({
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
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = dataSource.createQueryRunner();

    // ========== STEP 1: Lấy tất cả roles trong hệ thống ==========
    console.log('🔍 Fetching all available roles...');
    const allRoles = await queryRunner.manager.query(
      'SELECT id, name, code FROM roles ORDER BY name'
    );

    if (allRoles.length === 0) {
      console.error('❌ No roles found in the system!');
      console.log('   Please run "pnpm run seed:roles-permissions" first.\n');
      return;
    }

    console.log(`✅ Found ${allRoles.length} roles in the system:`);
    allRoles.forEach((role, index) => {
      console.log(`   ${index + 1}. ${role.name} (${role.code})`);
    });
    console.log();

    // ========== STEP 2: Kiểm tra user đã tồn tại chưa ==========
    console.log('🔍 Checking if user already exists...');
    const existingUser = await queryRunner.manager.query(
      'SELECT id, username, "fullName", email FROM users WHERE username = $1',
      ['21012345']
    );

    let userId: string;

    if (existingUser.length > 0) {
      // User đã tồn tại - cập nhật roles
      userId = existingUser[0].id;
      console.log('⚠️  User with username "21012345" already exists!');
      console.log(`   User ID: ${userId}`);
      console.log(`   Full Name: ${existingUser[0].fullName}`);
      console.log(`   Email: ${existingUser[0].email}`);
      console.log('\n🔄 Updating user roles...\n');

      // Xóa tất cả roles hiện tại
      console.log('�️  Removing existing roles...');
      await queryRunner.manager.query(
        `DELETE FROM user_roles WHERE "userId" = $1`,
        [userId]
      );
      console.log('✅ Existing roles removed\n');

    } else {
      // User chưa tồn tại - tạo mới
      console.log('✅ User does not exist, proceeding with creation...\n');

      // ========== STEP 3: Hash password ==========
      console.log('🔐 Hashing password...');
      const hashedPassword = await bcrypt.hash('admin123', 12);
      console.log('✅ Password hashed successfully\n');

      // ========== STEP 4: Tạo user admin ==========
      console.log('👤 Creating admin user...');
      
      const result = await queryRunner.manager.query(
        `INSERT INTO users (username, password, "fullName", email, status, "createdAt", "updatedAt") 
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) 
         RETURNING id, username, "fullName", email, status`,
        ['21012345', hashedPassword, 'Admin', 'admin@fit.hcmus.edu.vn', 'ACTIVE']
      );

      const savedUser = result[0];
      userId = savedUser.id;
      console.log('✅ Admin user created successfully!');
      console.log(`   User ID: ${savedUser.id}`);
      console.log(`   Username: ${savedUser.username}`);
      console.log(`   Full Name: ${savedUser.fullName}`);
      console.log(`   Email: ${savedUser.email}`);
      console.log(`   Status: ${savedUser.status}\n`);
    }

    // ========== STEP 5: Gán TẤT CẢ roles cho user ==========
    console.log('🔗 Assigning ALL roles to user...');
    
    for (const role of allRoles) {
      await queryRunner.manager.query(
        `INSERT INTO user_roles ("userId", "roleId") VALUES ($1, $2)`,
        [userId, role.id]
      );
      console.log(`   ✓ Assigned: ${role.name}`);
    }
    
    console.log(`\n✅ Successfully assigned ${allRoles.length} roles to user\n`);

    // ========== VERIFICATION ==========
    console.log('🔍 Verifying final result...');
    const verifyUser = await queryRunner.manager.query(
      `SELECT u.id, u.username, u."fullName", u.email, r.name as role_name, r.code as role_code
       FROM users u
       JOIN user_roles ur ON u.id = ur."userId"
       JOIN roles r ON ur."roleId" = r.id
       WHERE u.id = $1
       ORDER BY r.name`,
      [userId]
    );

    if (verifyUser.length > 0) {
      console.log('✅ Verification successful!');
      console.log(`   User has ${verifyUser.length} role(s) assigned:`);
      verifyUser.forEach((ur, index) => {
        console.log(`   ${index + 1}. ${ur.role_name} (${ur.role_code})`);
      });
      console.log();
    }

    console.log('🎉 Seed completed successfully!\n');
    console.log('📝 Login credentials:');
    console.log('   Username: 21012345');
    console.log('   Password: admin123');
    console.log(`   Roles: ${verifyUser.map(r => r.role_name).join(', ')}\n`);

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seed function
seedAdminUser()
  .then(() => {
    console.log('✅ Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
