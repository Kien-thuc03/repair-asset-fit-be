/**
 * SEED DATA SCRIPT - Rooms for Building H
 *
 * Script này tạo phòng học cho tòa H với:
 * - 9 tầng (01 đến 09)
 * - Mỗi tầng có 5 phòng (01 đến 05)
 * - Tổng cộng: 45 phòng
 *
 * Cách chạy:
 * 1. Đảm bảo database đã được khởi động: docker-compose up -d
 * 2. Chạy: npx ts-node src/seeds/seed-rooms-building-h.ts
 *
 * Lưu ý: Script sẽ bỏ qua phòng đã tồn tại (dựa vào roomCode)
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables từ file .env
config({ path: resolve(__dirname, "../../.env") });

// ========== CONFIGURATION ==========
const BUILDING = "H";
const TOTAL_FLOORS = 9; // Từ 01 đến 09
const ROOMS_PER_FLOOR = 5; // Từ 01 đến 05
// Unit là optional - nếu không cần gán unit thì comment dòng dưới
// const UNIT_CODE = 1; // unitCode của đơn vị (kiểu number)

// ========== MAIN SEED FUNCTION ==========
async function seedRoomsBuildinH() {
  console.log("🌱 Starting seed script for Building H Rooms...\n");
  console.log(`📊 Configuration:`);
  console.log(`   Building: ${BUILDING}`);
  console.log(`   Total Floors: ${TOTAL_FLOORS}`);
  console.log(`   Rooms per Floor: ${ROOMS_PER_FLOOR}`);
  console.log(`   Total Rooms to create: ${TOTAL_FLOORS * ROOMS_PER_FLOOR}\n`);

  // Kết nối database
  const dataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    entities: [],
    synchronize: false,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    await dataSource.initialize();
    console.log("✅ Database connection established\n");

    const queryRunner = dataSource.createQueryRunner();

    // ========== STEP 1: Tìm Unit ID (tùy chọn - DISABLED) ==========
    // Nếu muốn gán unit cho rooms, uncomment code bên dưới và set UNIT_CODE
    let unitId: string | null = null;

    /*
    console.log('🔍 Looking for unit...');
    const UNIT_CODE = 1; // Thay đổi unitCode tại đây
    const units = await queryRunner.manager.query(
      'SELECT id, name, "unitCode" FROM units WHERE "unitCode" = $1',
      [UNIT_CODE]
    );

    if (units.length > 0) {
      unitId = units[0].id;
      console.log(`✅ Found unit: ${units[0].name} (Code: ${units[0].unitCode})`);
      console.log(`   Unit ID: ${unitId}\n`);
    } else {
      console.log(`⚠️  Unit with unitCode "${UNIT_CODE}" not found. Rooms will be created without unit.\n`);
    }
    */

    console.log("ℹ️  Creating rooms without unit assignment\n");

    // ========== STEP 2: Tạo danh sách rooms cần tạo ==========
    console.log("📝 Generating room list...\n");

    const roomsToCreate = [];
    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (let floor = 1; floor <= TOTAL_FLOORS; floor++) {
      const floorStr = floor.toString().padStart(2, "0"); // 01, 02, ..., 09

      for (let roomNum = 1; roomNum <= ROOMS_PER_FLOOR; roomNum++) {
        const roomNumStr = roomNum.toString().padStart(2, "0"); // 01, 02, ..., 05

        // Format roomCode: H.01.01 (Building.Floor.RoomNumber)
        const roomCode = `${BUILDING}.${floorStr}.${roomNumStr}`;
        const roomName = `Phòng ${roomCode}`;

        roomsToCreate.push({
          name: roomName,
          building: BUILDING,
          roomCode: roomCode,
          floor: floorStr,
          roomNumber: roomNumStr,
          unitId: unitId,
          status: "ACTIVE",
        });
      }
    }

    console.log(`📊 Total rooms to process: ${roomsToCreate.length}\n`);

    // ========== STEP 3: Insert rooms vào database ==========
    console.log("🏗️  Creating rooms...\n");

    for (const room of roomsToCreate) {
      try {
        // Kiểm tra phòng đã tồn tại chưa
        const existing = await queryRunner.manager.query(
          'SELECT id, "roomCode" FROM rooms WHERE "roomCode" = $1',
          [room.roomCode]
        );

        if (existing.length > 0) {
          console.log(`   ⏭️  Skipped: ${room.roomCode} (already exists)`);
          skippedCount++;
          continue;
        }

        // Insert room mới
        await queryRunner.manager.query(
          `INSERT INTO rooms (name, building, "roomCode", floor, "roomNumber", "unitId", status, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())`,
          [
            room.name,
            room.building,
            room.roomCode,
            room.floor,
            room.roomNumber,
            room.unitId,
            room.status,
          ]
        );

        console.log(`   ✅ Created: ${room.roomCode} - ${room.name}`);
        createdCount++;
      } catch (error) {
        const err = error as Error;
        console.error(`   ❌ Error creating ${room.roomCode}:`, err.message);
        errorCount++;
      }
    }

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(60));
    console.log("📊 SEED SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully created: ${createdCount} rooms`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} rooms`);
    console.log(`❌ Failed: ${errorCount} rooms`);
    console.log(`📍 Total processed: ${roomsToCreate.length} rooms`);
    console.log("=".repeat(60) + "\n");

    // ========== VERIFICATION ==========
    if (createdCount > 0) {
      console.log("🔍 Verifying created rooms...\n");

      const verifyRooms = await queryRunner.manager.query(
        `SELECT id, name, building, floor, "roomNumber", "roomCode", status
         FROM rooms
         WHERE building = $1
         ORDER BY floor, "roomNumber"
         LIMIT 10`,
        [BUILDING]
      );

      console.log(`Sample of created rooms (showing first 10):`);
      verifyRooms.forEach((room, index) => {
        console.log(
          `   ${index + 1}. ${room.roomCode} - ${room.name} (Floor: ${room.floor}, Status: ${room.status})`
        );
      });
      console.log();
    }

    console.log("🎉 Seed completed successfully!\n");
  } catch (error) {
    console.error("❌ Error during seeding:", error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log("🔌 Database connection closed");
    }
  }
}

// Run the seed function
seedRoomsBuildinH()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
