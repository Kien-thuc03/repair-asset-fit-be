import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../src/entities/user.entity';
import { UserRole } from '../src/common/utils/constants';

// Cấu hình database connection
const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'repair_asset_fit',
  entities: [User],
  synchronize: false,
});

async function seed() {
  try {
    // Khởi tạo kết nối
    await AppDataSource.initialize();
    console.log('✅ Database connection established');

    const userRepository = AppDataSource.getRepository(User);

    // Dữ liệu người dùng mẫu
    const users = [
      {
        username: 'admin',
        email: 'admin@fit.iuh.edu.vn',
        password: await bcrypt.hash('Admin@123', 10),
        firstName: 'Admin',
        lastName: 'System',
        phone: '0123456789',
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        username: 'gv001',
        email: 'giaovien01@fit.iuh.edu.vn',
        password: await bcrypt.hash('Gv@123456', 10),
        firstName: 'Nguyễn Văn',
        lastName: 'A',
        phone: '0987654321',
        role: UserRole.USER,
        isActive: true,
      },
      {
        username: 'ktv001',
        email: 'kythuat01@fit.iuh.edu.vn',
        password: await bcrypt.hash('Ktv@123456', 10),
        firstName: 'Trần Thị',
        lastName: 'B',
        phone: '0912345678',
        role: UserRole.TECHNICIAN,
        isActive: true,
      },
      {
        username: 'ttkt001',
        email: 'totruong01@fit.iuh.edu.vn',
        password: await bcrypt.hash('Ttkt@123456', 10),
        firstName: 'Lê Văn',
        lastName: 'C',
        phone: '0909090909',
        role: UserRole.ADMIN,
        isActive: true,
      },
    ];

    // Xóa dữ liệu cũ (nếu có)
    console.log('🗑️  Cleaning old data...');
    await userRepository.clear();

    // Thêm dữ liệu mới
    console.log('📝 Inserting seed data...');
    for (const userData of users) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`✅ Created user: ${userData.username} (${userData.email})`);
    }

    console.log('✅ Seed completed successfully!');
    console.log('\n📋 Login credentials:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Admin:');
    console.log('  Username: admin');
    console.log('  Password: Admin@123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Giảng viên:');
    console.log('  Username: gv001');
    console.log('  Password: Gv@123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Kỹ thuật viên:');
    console.log('  Username: ktv001');
    console.log('  Password: Ktv@123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Tổ trưởng kỹ thuật:');
    console.log('  Username: ttkt001');
    console.log('  Password: Ttkt@123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    await AppDataSource.destroy();
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

// Chạy seed
seed();
