/**
 * SEED DATA SCRIPT - Technician Assignments for Building H
 *
 * Script này phân công kỹ thuật viên phụ trách các tầng tại tòa H:
 * - Kỹ thuật viên 1 (21033333): Tầng 1-5 của tòa H
 * - Kỹ thuật viên 2 (21022222): Tầng 4-9 của tòa H
 *
 * Cách chạy:
 * 1. Đảm bảo database đã được khởi động: docker-compose up -d
 * 2. Chạy: pnpm run seed:technician-assignments-h
 *
 * Lưu ý: Script sẽ bỏ qua assignment đã tồn tại
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables từ file .env
config({ path: resolve(__dirname, "../../.env") });

// ========== CONFIGURATION ==========
const BUILDING = "H";

// Danh sách kỹ thuật viên và tầng phụ trách
const TECHNICIAN_ASSIGNMENTS = [
  {
    technicianId: "5f24b49b-8625-428f-badf-67c247adf0b3", // Username: 21033333
    username: "21033333",
    floors: ["01", "02", "03", "04", "05"], // Tầng 1-5
  },
  {
    technicianId: "98ef7e7a-8d6e-4ed0-a61a-423fb0bd3611", // Username: 21022222
    username: "21022222",
    floors: ["04", "05", "06", "07", "08", "09"], // Tầng 4-9 (có overlap tầng 4-5)
  },
];

// ========== MAIN SEED FUNCTION ==========
async function seedTechnicianAssignmentsBuildinH() {
  console.log(
    "🌱 Starting seed script for Technician Assignments (Building H)...\n"
  );
  console.log(`📊 Configuration:`);
  console.log(`   Building: ${BUILDING}`);
  console.log(`   Number of Technicians: ${TECHNICIAN_ASSIGNMENTS.length}`);
  console.log(
    `   Total Assignments to create: ${TECHNICIAN_ASSIGNMENTS.reduce((sum, t) => sum + t.floors.length, 0)}\n`
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
    console.log("🔍 Verifying technicians exist in database...\n");

    for (const tech of TECHNICIAN_ASSIGNMENTS) {
      const users = await queryRunner.manager.query(
        'SELECT id, username, "fullName", email FROM users WHERE id = $1',
        [tech.technicianId]
      );

      if (users.length === 0) {
        console.error(
          `❌ Technician with ID "${tech.technicianId}" not found!`
        );
        console.log(
          `   Please ensure the user exists before running this seed.\n`
        );
        return;
      }

      console.log(
        `✅ Found technician: ${users[0].username} - ${users[0].fullName || "N/A"}`
      );
      console.log(`   Email: ${users[0].email}`);
      console.log(`   Will be assigned to floors: ${tech.floors.join(", ")}\n`);
    }

    // ========== STEP 2: Create assignments ==========
    console.log("🏗️  Creating technician assignments...\n");

    let createdCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const tech of TECHNICIAN_ASSIGNMENTS) {
      console.log(`📋 Processing technician: ${tech.username}`);

      for (const floor of tech.floors) {
        try {
          // Kiểm tra assignment đã tồn tại chưa
          const existing = await queryRunner.manager.query(
            `SELECT id, "technicianId", building, floor 
             FROM technician_assignments 
             WHERE "technicianId" = $1 AND building = $2 AND floor = $3`,
            [tech.technicianId, BUILDING, floor]
          );

          if (existing.length > 0) {
            console.log(
              `   ⏭️  Skipped: Floor ${floor} (already assigned to this technician)`
            );
            skippedCount++;
            continue;
          }

          // Insert assignment mới
          await queryRunner.manager.query(
            `INSERT INTO technician_assignments ("technicianId", building, floor)
             VALUES ($1, $2, $3)`,
            [tech.technicianId, BUILDING, floor]
          );

          console.log(`   ✅ Assigned: Floor ${floor} of Building ${BUILDING}`);
          createdCount++;
        } catch (error) {
          const err = error as Error;
          console.error(`   ❌ Error assigning floor ${floor}:`, err.message);
          errorCount++;
        }
      }
      console.log();
    }

    // ========== SUMMARY ==========
    console.log("=".repeat(60));
    console.log("📊 SEED SUMMARY");
    console.log("=".repeat(60));
    console.log(`✅ Successfully created: ${createdCount} assignments`);
    console.log(`⏭️  Skipped (already exists): ${skippedCount} assignments`);
    console.log(`❌ Failed: ${errorCount} assignments`);
    console.log(
      `📍 Total processed: ${TECHNICIAN_ASSIGNMENTS.reduce((sum, t) => sum + t.floors.length, 0)} assignments`
    );
    console.log("=".repeat(60) + "\n");

    // ========== VERIFICATION ==========
    if (createdCount > 0 || skippedCount > 0) {
      console.log("🔍 Verifying all assignments for Building H...\n");

      const verifyAssignments = await queryRunner.manager.query(
        `SELECT 
          ta.id,
          ta."technicianId",
          ta.building,
          ta.floor,
          u.username,
          u."fullName"
         FROM technician_assignments ta
         JOIN users u ON ta."technicianId" = u.id
         WHERE ta.building = $1
         ORDER BY u.username, ta.floor`,
        [BUILDING]
      );

      console.log(
        `Found ${verifyAssignments.length} assignment(s) for Building ${BUILDING}:`
      );
      console.log();

      // Group by technician
      const groupedByTechnician = verifyAssignments.reduce(
        (acc, assignment) => {
          const key = assignment.username;
          if (!acc[key]) {
            acc[key] = {
              username: assignment.username,
              fullName: assignment.fullName,
              floors: [],
            };
          }
          acc[key].floors.push(assignment.floor);
          return acc;
        },
        {}
      );

      Object.values(groupedByTechnician).forEach((tech: any, index) => {
        console.log(
          `   ${index + 1}. ${tech.username} - ${tech.fullName || "N/A"}`
        );
        console.log(`      Assigned floors: ${tech.floors.sort().join(", ")}`);
        console.log();
      });
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
seedTechnicianAssignmentsBuildinH()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
