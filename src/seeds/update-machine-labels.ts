/**
 * SEED DATA SCRIPT - Update Machine Labels
 * 
 * Script này cập nhật machineLabel cho TẤT CẢ computers trong database
 * sử dụng logic generateMachineLabel từ AssetsMigrationService
 * 
 * Format machineLabel: {building}{floor}{roomNumber}M{machineNumber}
 * Ví dụ: H301M01, A201M02, B105M03
 * 
 * Cách chạy:
 * 1. Đảm bảo database đã được khởi động: docker-compose up -d
 * 2. Chạy: pnpm run seed:update-machine-labels
 * 
 * Lưu ý: Script sẽ cập nhật machineLabel theo thứ tự trong từng phòng
 */

import { DataSource } from 'typeorm';
import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables từ file .env
config({ path: resolve(__dirname, '../../.env') });

// ========== TYPE DEFINITIONS ==========
interface Room {
  id: string;
  building: string;
  floor: string;
  roomNumber: string;
  name: string;
}

interface Computer {
  id: string;
  assetId: string;
  roomId: string;
  machineLabel: string;
  room?: Room;
}

// ========== HELPER FUNCTIONS ==========

/**
 * Generate machine label từ room và số thứ tự máy
 * Logic tương tự như trong AssetsMigrationService
 */
function generateMachineLabel(
  room: Room,
  machineNumber: number
): string {
  // Format: {building}{floor}{roomNumber}M{machineNumber}
  // Ví dụ: H301M01, A201M15
  const paddedNumber = String(machineNumber).padStart(2, '0');
  return `${room.building}${room.floor}${room.roomNumber}M${paddedNumber}`;
}

// ========== MAIN SEED FUNCTION ==========
async function updateMachineLabels() {
  console.log('🌱 Starting seed script for updating Machine Labels...\n');

  // Kết nối database
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    entities: [],
    synchronize: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established\n');

    const queryRunner = dataSource.createQueryRunner();

    // ========== STEP 1: Lấy tất cả computers với room info ==========
    console.log('🔍 Fetching all computers with room information...');
    
    const computers: Computer[] = await queryRunner.manager.query(`
      SELECT 
        c.id,
        c."assetId",
        c."roomId",
        c."machineLabel" as "currentLabel",
        r.id as "roomId",
        r.building,
        r.floor,
        r."roomNumber",
        r.name as "roomName"
      FROM computers c
      LEFT JOIN rooms r ON c."roomId" = r.id
      ORDER BY r.building, r.floor, r."roomNumber", c.id
    `);

    if (computers.length === 0) {
      console.log('⚠️  No computers found in database.');
      console.log('   Please run migration or add computers first.\n');
      return;
    }

    console.log(`✅ Found ${computers.length} computers to update\n`);

    // ========== STEP 2: Group computers theo room ==========
    console.log('📦 Grouping computers by room...');
    
    const computersByRoom = new Map<string, Computer[]>();
    const computersWithoutRoom: Computer[] = [];

    for (const computer of computers) {
      if (!computer.roomId) {
        computersWithoutRoom.push(computer);
        continue;
      }

      if (!computersByRoom.has(computer.roomId)) {
        computersByRoom.set(computer.roomId, []);
      }
      computersByRoom.get(computer.roomId)!.push(computer);
    }

    console.log(`✅ Grouped into ${computersByRoom.size} rooms\n`);

    if (computersWithoutRoom.length > 0) {
      console.log(`⚠️  Warning: ${computersWithoutRoom.length} computers have no room assigned`);
      console.log('   These will be skipped.\n');
    }

    // ========== STEP 3: Update machine labels ==========
    console.log('🔄 Updating machine labels...\n');
    
    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    // Process each room
    for (const [roomId, roomComputers] of computersByRoom.entries()) {
      const firstComputer = roomComputers[0];
      const room: Room = {
        id: roomId,
        building: (firstComputer as any).building,
        floor: (firstComputer as any).floor,
        roomNumber: (firstComputer as any).roomNumber,
        name: (firstComputer as any).roomName,
      };

      console.log(`\n📍 Processing Room: ${room.building}${room.floor}${room.roomNumber} - ${room.name}`);
      console.log(`   Computers in room: ${roomComputers.length}`);

      // Update each computer in the room
      for (let i = 0; i < roomComputers.length; i++) {
        const computer = roomComputers[i];
        const machineNumber = i + 1;
        const newMachineLabel = generateMachineLabel(room, machineNumber);

        try {
          // Update trong database
          await queryRunner.manager.query(
            `UPDATE computers 
             SET "machineLabel" = $1
             WHERE id = $2`,
            [newMachineLabel, computer.id]
          );

          console.log(`   ✓ ${i + 1}. ${(computer as any).currentLabel || 'NULL'} → ${newMachineLabel}`);
          updatedCount++;
        } catch (error) {
          const err = error as Error;
          console.error(`   ✗ ${i + 1}. Failed to update computer ${computer.id}:`, err.message);
          errorCount++;
        }
      }
    }

    skippedCount = computersWithoutRoom.length;

    // ========== STEP 4: Summary ==========
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Update completed!\n');
    console.log('📊 Summary:');
    console.log(`   Total computers: ${computers.length}`);
    console.log(`   ✅ Successfully updated: ${updatedCount}`);
    console.log(`   ⏭️  Skipped (no room): ${skippedCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log('='.repeat(60) + '\n');

    // ========== STEP 5: Verification (sample) ==========
    if (updatedCount > 0) {
      console.log('🔍 Verification - Sample of updated computers:');
      
      const sampleComputers = await queryRunner.manager.query(`
        SELECT 
          c."machineLabel",
          r.building,
          r.floor,
          r."roomNumber",
          r.name as "roomName"
        FROM computers c
        LEFT JOIN rooms r ON c."roomId" = r.id
        ORDER BY r.building, r.floor, r."roomNumber", c."machineLabel"
        LIMIT 10
      `);

      sampleComputers.forEach((comp, index) => {
        console.log(`   ${index + 1}. ${comp.machineLabel} - Room: ${comp.building}${comp.floor}${comp.roomNumber} (${comp.roomName})`);
      });
      console.log();
    }

    console.log('✅ All machine labels have been updated successfully!\n');

  } catch (error) {
    console.error('❌ Error during update:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the seed function
updateMachineLabels()
  .then(() => {
    console.log('✅ Seed script finished successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seed script failed:', error);
    process.exit(1);
  });
