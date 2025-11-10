/**
 * SEED DATA SCRIPT - Computers for Building H Rooms
 *
 * Script này tạo computers cho các phòng tòa H với:
 * - Dựa trên các assets đã có sẵn trong database
 * - Mỗi phòng có 10 máy (từ Máy 01 đến Máy 10)
 * - Tự động tạo asset mới nếu không đủ
 *
 * Cách chạy:
 * 1. Đảm bảo database đã được khởi động và đã có rooms tòa H
 * 2. Chạy: pnpm run seed:computers-building-h
 *
 * Lưu ý: Script sẽ bỏ qua computer đã tồn tại (dựa vào roomId + machineLabel)
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables từ file .env
config({ path: resolve(__dirname, "../../.env") });

// ========== CONFIGURATION ==========
const BUILDING = "H";
const COMPUTERS_PER_ROOM = 10; // Mỗi phòng 10 máy
const COMPUTER_CATEGORY_NAME = "Máy tính"; // Tên category cho máy tính

// ========== HELPER FUNCTIONS ==========
function generatektCode(index: number): {
  ktCode: string;
  fixedCode: string;
} {
  const year = new Date().getFullYear().toString().slice(-2); // 24, 25, etc.
  const seq = index.toString().padStart(4, "0");

  return {
    ktCode: `${year}-${seq}/00`,
    fixedCode: `1000.${seq}`,
  };
}

// ========== MAIN SEED FUNCTION ==========
async function seedComputersBuildingH() {
  console.log("🌱 Starting seed script for Building H Computers...\n");
  console.log(`📊 Configuration:`);
  console.log(`   Building: ${BUILDING}`);
  console.log(`   Computers per Room: ${COMPUTERS_PER_ROOM}`);
  console.log(`   Computer Category: ${COMPUTER_CATEGORY_NAME}\n`);

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

    // ========== STEP 1: Lấy tất cả rooms của tòa H ==========
    console.log("🔍 Fetching rooms in Building H...");
    const rooms = await queryRunner.manager.query(
      `SELECT id, "roomCode", name, building, floor, "roomNumber"
       FROM rooms
       WHERE building = $1 AND "deletedAt" IS NULL
       ORDER BY floor, "roomNumber"`,
      [BUILDING]
    );

    if (rooms.length === 0) {
      console.error(`❌ No rooms found for building ${BUILDING}!`);
      console.log('   Please run "pnpm run seed:rooms-building-h" first.\n');
      return;
    }

    console.log(`✅ Found ${rooms.length} rooms in Building ${BUILDING}\n`);

    // ========== STEP 2: Tìm admin user để gán làm creator ==========
    console.log("🔍 Looking for admin user...");
    const adminUsers = await queryRunner.manager.query(
      `SELECT id, username, "fullName" FROM users WHERE username = $1 LIMIT 1`,
      ["21012345"]
    );

    let creatorUserId: string;
    if (adminUsers.length > 0) {
      creatorUserId = adminUsers[0].id;
      console.log(
        `✅ Found admin user: ${adminUsers[0].fullName} (${adminUsers[0].username})`
      );
      console.log(`   Creator ID: ${creatorUserId}\n`);
    } else {
      console.error("❌ Admin user not found! Please create admin user first.");
      return;
    }

    // ========== STEP 3: Lấy category ID cho máy tính ==========
    console.log("🔍 Looking for computer category...");
    const categories = await queryRunner.manager.query(
      `SELECT id, name FROM categories WHERE name ILIKE $1 LIMIT 1`,
      [`%${COMPUTER_CATEGORY_NAME}%`]
    );

    if (categories.length === 0) {
      console.error(
        `❌ Category matching "${COMPUTER_CATEGORY_NAME}" not found!`
      );
      console.log("   Please check available categories in your database.\n");

      // Show available categories
      const allCategories = await queryRunner.manager.query(
        `SELECT id, name FROM categories ORDER BY name LIMIT 10`
      );
      console.log("   Available categories:");
      allCategories.forEach((cat, idx) => {
        console.log(`     ${idx + 1}. ${cat.name} (${cat.id})`);
      });
      console.log();
      return;
    }

    const computerCategoryId = categories[0].id;
    console.log(`✅ Category found: ${categories[0].name}`);
    console.log(`   Category ID: ${computerCategoryId}\n`);

    // ========== STEP 4: Đếm assets hiện có để tránh trùng code ==========
    const assetCountResult = await queryRunner.manager.query(
      `SELECT COUNT(*) as count FROM assets WHERE deleted_at IS NULL`
    );
    let ktCodeCounter = parseInt(assetCountResult[0].count) + 1;

    // ========== STEP 5: Tạo computers cho từng phòng ==========
    console.log("🏗️  Creating computers for each room...\n");

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let assetsCreated = 0;

    for (const room of rooms) {
      console.log(`\n📍 Processing Room: ${room.roomCode} (${room.name})`);

      for (let machineNum = 1; machineNum <= COMPUTERS_PER_ROOM; machineNum++) {
        const machineLabel = machineNum.toString().padStart(2, "0"); // 01, 02, ..., 10

        try {
          // Kiểm tra computer đã tồn tại chưa
          const existingComputer = await queryRunner.manager.query(
            `SELECT id FROM computers WHERE "roomId" = $1 AND "machineLabel" = $2`,
            [room.id, machineLabel]
          );

          if (existingComputer.length > 0) {
            console.log(`   ⏭️  Skipped: Máy ${machineLabel} (already exists)`);
            totalSkipped++;
            continue;
          }

          // ========== STEP 5.1: Tạo Asset mới cho máy tính ==========
          const { ktCode, fixedCode } = generatektCode(ktCodeCounter++);

          const assetResult = await queryRunner.manager.query(
            `INSERT INTO assets (
              kt_code, fixed_code, name, specs, entrydate, 
              current_room_id, unit, quantity, origin, purchase_package,
              type, category_id, status, shape, allow_move, created_by,
              created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
            RETURNING id`,
            [
              ktCode,
              fixedCode,
              `Máy tính ${room.roomCode}.${machineLabel}`,
              "Core i5, RAM 8GB, SSD 256GB", // Specs mặc định
              new Date().toISOString().split("T")[0], // entrydate
              room.id, // currentRoomId
              "Bộ", // unit
              1, // quantity
              "Việt Nam", // origin
              0, // purchasePackage
              "FIXED_ASSET", // type
              computerCategoryId, // categoryId
              "IN_USE", // status
              "COMPUTER", // shape
              true, // allowMove
              creatorUserId, // createdBy
            ]
          );

          const assetId = assetResult[0].id;
          assetsCreated++;

          // ========== STEP 5.2: Tạo Computer record ==========
          await queryRunner.manager.query(
            `INSERT INTO computers ("assetId", "roomId", "machineLabel", notes)
             VALUES ($1, $2, $3, $4)`,
            [
              assetId,
              room.id,
              machineLabel,
              `Máy tính ${room.roomCode}.${machineLabel}`,
            ]
          );

          console.log(`   ✅ Created: Máy ${machineLabel} (Asset: ${ktCode})`);
          totalCreated++;
        } catch (error) {
          const err = error as Error;
          console.error(
            `   ❌ Error creating Máy ${machineLabel}:`,
            err.message
          );
          totalErrors++;
        }
      }
    }

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(70));
    console.log("📊 SEED SUMMARY");
    console.log("=".repeat(70));
    console.log(`🏢 Rooms processed: ${rooms.length}`);
    console.log(`✅ Computers created: ${totalCreated}`);
    console.log(`📦 Assets created: ${assetsCreated}`);
    console.log(`⏭️  Skipped (already exists): ${totalSkipped}`);
    console.log(`❌ Failed: ${totalErrors}`);
    console.log(
      `📍 Expected total: ${rooms.length * COMPUTERS_PER_ROOM} computers`
    );
    console.log("=".repeat(70) + "\n");

    // ========== VERIFICATION ==========
    if (totalCreated > 0) {
      console.log("🔍 Verifying created computers...\n");

      const verifyComputers = await queryRunner.manager.query(
        `SELECT c.id, c."machineLabel", c."roomId", 
                r."roomCode", r.name as room_name,
                a.kt_code, a.name as asset_name
         FROM computers c
         JOIN rooms r ON c."roomId" = r.id
         JOIN assets a ON c."assetId" = a.id
         WHERE r.building = $1
         ORDER BY r.floor, r."roomNumber", c."machineLabel"
         LIMIT 15`,
        [BUILDING]
      );

      console.log(`Sample of created computers (showing first 15):`);
      verifyComputers.forEach((comp, index) => {
        console.log(
          `   ${index + 1}. ${comp.roomCode} - Máy ${comp.machineLabel} (${comp.kt_code})`
        );
      });
      console.log();

      // Count total computers in Building H
      const totalCount = await queryRunner.manager.query(
        `SELECT COUNT(*) as total
         FROM computers c
         JOIN rooms r ON c."roomId" = r.id
         WHERE r.building = $1`,
        [BUILDING]
      );
      console.log(
        `📊 Total computers in Building ${BUILDING}: ${totalCount[0].total}\n`
      );
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
seedComputersBuildingH()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
