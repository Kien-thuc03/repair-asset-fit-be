/**
 * SEED DATA SCRIPT - Technician Assignments for Building H
 *
 * Script này tạo phân công kỹ thuật viên phụ trách các tầng trong tòa H:
 * - Kỹ thuật viên 1 (Phan Anh Tuấn - 21033333): Phụ trách tầng 1-5
 * - Kỹ thuật viên 2 (Nguyễn Văn Đạt - 21022222): Phụ trách tầng 4-6
 *
 * Cách chạy:
 * 1. Đảm bảo database đã được khởi động: docker-compose up -d
 * 2. Đảm bảo đã có users với ID tương ứng
 * 3. Chạy: pnpm run seed:technician-assignments-h
 *
 * Lưu ý:
 * - Script sẽ bỏ qua nếu assignment đã tồn tại
 * - Tầng 4 và 5 sẽ có 2 kỹ thuật viên phụ trách (overlap)
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables từ file .env
config({ path: resolve(__dirname, "../../.env") });

// ========== TECHNICIAN ASSIGNMENTS DATA ==========
const TECHNICIAN_ASSIGNMENTS = [
  // Kỹ thuật viên 1: Phan Anh Tuấn (ID: 5f24b49b-8625-428f-badf-67c247adf0b3)
  // Phụ trách tầng 1-5 tòa H
  {
    technicianId: "5f24b49b-8625-428f-badf-67c247adf0b3",
    technicianName: "Phan Anh Tuấn (21033333)",
    building: "H",
    floors: ["01", "02", "03", "04", "05"],
  },

  // Kỹ thuật viên 2: Nguyễn Văn Đạt (ID: 98ef7e7a-8d6e-4ed0-a61a-423fb0bd3611)
  // Phụ trách tầng 4-6 tòa H
  {
    technicianId: "98ef7e7a-8d6e-4ed0-a61a-423fb0bd3611",
    technicianName: "Nguyễn Văn Đạt (21022222)",
    building: "H",
    floors: ["04", "05", "06"],
  },
];

// ========== MAIN SEED FUNCTION ==========
async function seedTechnicianAssignments() {
  console.log(
    "🌱 Starting seed script for Technician Assignments - Building H...\n"
  );

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

    // ========== STEP 1: Verify technicians exist ==========
    console.log("🔍 Step 1: Verifying technicians exist in database...");

    for (const assignment of TECHNICIAN_ASSIGNMENTS) {
      const techExists = await queryRunner.manager.query(
        'SELECT id, username, "fullName" FROM users WHERE id = $1',
        [assignment.technicianId]
      );

      if (techExists.length === 0) {
        console.error(
          `❌ ERROR: Technician with ID ${assignment.technicianId} not found!`
        );
        console.log(
          "   Please ensure the user exists before running this seed.\n"
        );
        return;
      }

      console.log(
        `✅ Found: ${techExists[0].fullName} (${techExists[0].username})`
      );
    }
    console.log();

    // ========== STEP 2: Seed assignments ==========
    console.log("📋 Step 2: Creating technician assignments...\n");

    let totalCreated = 0;
    let totalSkipped = 0;

    for (const assignment of TECHNICIAN_ASSIGNMENTS) {
      console.log(
        `👤 Processing assignments for ${assignment.technicianName}:`
      );
      console.log(`   Building: ${assignment.building}`);
      console.log(`   Floors: ${assignment.floors.join(", ")}\n`);

      for (const floor of assignment.floors) {
        // Check if assignment already exists
        const existing = await queryRunner.manager.query(
          `SELECT id FROM technician_assignments 
           WHERE "technicianId" = $1 AND building = $2 AND floor = $3`,
          [assignment.technicianId, assignment.building, floor]
        );

        if (existing.length > 0) {
          console.log(`   ⏭️  Floor ${floor}: Already assigned - skipping`);
          totalSkipped++;
        } else {
          await queryRunner.manager.query(
            `INSERT INTO technician_assignments ("technicianId", building, floor) 
             VALUES ($1, $2, $3)`,
            [assignment.technicianId, assignment.building, floor]
          );
          console.log(`   ✅ Floor ${floor}: Assignment created`);
          totalCreated++;
        }
      }
      console.log();
    }

    // ========== STEP 3: Verification ==========
    console.log("🔍 Step 3: Verifying assignments...\n");

    const verifyAssignments = await queryRunner.manager.query(
      `SELECT 
         ta.building, 
         ta.floor, 
         u.username, 
         u."fullName"
       FROM technician_assignments ta
       JOIN users u ON ta."technicianId" = u.id
       WHERE ta.building = 'H'
       ORDER BY ta.floor, u."fullName"`
    );

    if (verifyAssignments.length > 0) {
      console.log("📊 Current assignments for Building H:");
      console.log("═══════════════════════════════════════════════════════\n");

      // Group by floor
      const floorGroups = verifyAssignments.reduce(
        (acc, item) => {
          if (!acc[item.floor]) {
            acc[item.floor] = [];
          }
          acc[item.floor].push(`${item.fullName} (${item.username})`);
          return acc;
        },
        {} as Record<string, string[]>
      );

      // Display
      Object.keys(floorGroups)
        .sort()
        .forEach((floor) => {
          console.log(`   Floor ${floor}:`);
          floorGroups[floor].forEach((tech) => {
            console.log(`      - ${tech}`);
          });
          console.log();
        });
    }

    console.log("═══════════════════════════════════════════════════════");
    console.log("🎉 Seed completed successfully!\n");
    console.log("📊 Summary:");
    console.log(`   - Created: ${totalCreated} assignments`);
    console.log(`   - Skipped: ${totalSkipped} assignments (already exist)`);
    console.log(
      `   - Total in Building H: ${verifyAssignments.length} assignments`
    );
    console.log("═══════════════════════════════════════════════════════\n");
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
seedTechnicianAssignments()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
