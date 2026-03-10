/**
 * SEED DATA SCRIPT - Computer Components for Building H
 *
 * Script này tạo components (linh kiện) cho các computers tòa H với:
 * - Tự động tạo linh kiện cơ bản cho mỗi máy tính
 * - Các loại linh kiện: CPU, RAM, MAINBOARD, STORAGE, GPU, PSU, CASE, MONITOR, KEYBOARD, MOUSE
 *
 * Cách chạy:
 * 1. Đảm bảo đã chạy seed computers trước
 * 2. Chạy: pnpm run seed:components-building-h
 *
 * Lưu ý: Script sẽ bỏ qua component đã tồn tại
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables từ file .env
config({ path: resolve(__dirname, "../../.env") });

// ========== CONFIGURATION ==========
const BUILDING = "H";

// Component templates - Thông tin linh kiện cơ bản cho mỗi máy
const COMPONENT_TEMPLATES = [
  {
    componentType: "CPU",
    name: "Intel Core i5-12400",
    componentSpecs: "6 Cores, 12 Threads, 2.5GHz Base, 4.4GHz Boost",
  },
  {
    componentType: "RAM",
    name: "Kingston Fury Beast DDR4",
    componentSpecs: "8GB 3200MHz",
  },
  {
    componentType: "MAINBOARD",
    name: "ASUS Prime B660M-A",
    componentSpecs: "LGA1700, DDR4, M.2",
  },
  {
    componentType: "STORAGE",
    name: "Samsung 980 NVMe SSD",
    componentSpecs: "256GB, M.2 PCIe 3.0",
  },
  {
    componentType: "GPU",
    name: "Intel UHD Graphics 730",
    componentSpecs: "Integrated Graphics",
  },
  {
    componentType: "PSU",
    name: "Cooler Master MWE 450W",
    componentSpecs: "450W, 80+ Bronze",
  },
  {
    componentType: "CASE",
    name: "Cooler Master MasterBox Q300L",
    componentSpecs: "Micro-ATX",
  },
  {
    componentType: "MONITOR",
    name: "Dell P2422H",
    componentSpecs: "24 inch, 1920x1080, IPS",
  },
  {
    componentType: "KEYBOARD",
    name: "Logitech K120",
    componentSpecs: "USB Wired Keyboard",
  },
  {
    componentType: "MOUSE",
    name: "Logitech M90",
    componentSpecs: "USB Wired Mouse",
  },
];

// ========== MAIN SEED FUNCTION ==========
async function seedComponentsBuildingH() {
  console.log(
    "🌱 Starting seed script for Building H Computer Components...\n"
  );
  console.log(`📊 Configuration:`);
  console.log(`   Building: ${BUILDING}`);
  console.log(`   Components per computer: ${COMPONENT_TEMPLATES.length}`);
  console.log(
    `   Component types: ${COMPONENT_TEMPLATES.map((c) => c.componentType).join(", ")}\n`
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

    // ========== STEP 1: Lấy tất cả computers của tòa H ==========
    console.log("🔍 Fetching computers in Building H...");
    const computers = await queryRunner.manager.query(
      `SELECT c.id, c."assetId", c."machineLabel", c."roomId",
              r."roomCode", r.building
       FROM computers c
       JOIN rooms r ON c."roomId" = r.id
       WHERE r.building = $1
       ORDER BY r.floor, r."roomNumber", c."machineLabel"`,
      [BUILDING]
    );

    if (computers.length === 0) {
      console.error(`❌ No computers found for building ${BUILDING}!`);
      console.log(
        '   Please run "pnpm run seed:computers-building-h" first.\n'
      );
      return;
    }

    console.log(
      `✅ Found ${computers.length} computers in Building ${BUILDING}\n`
    );

    // ========== STEP 2: Tạo components cho từng computer ==========
    console.log("🏗️  Creating components for each computer...\n");

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let processedComputers = 0;

    for (const computer of computers) {
      processedComputers++;

      if (processedComputers % 50 === 0) {
        console.log(
          `📍 Progress: ${processedComputers}/${computers.length} computers processed...`
        );
      }

      for (const template of COMPONENT_TEMPLATES) {
        try {
          // Kiểm tra component đã tồn tại chưa
          const existingComponent = await queryRunner.manager.query(
            `SELECT id FROM computer_components 
             WHERE "computerAssetId" = $1 AND "componentType" = $2`,
            [computer.id, template.componentType]
          );

          if (existingComponent.length > 0) {
            totalSkipped++;
            continue;
          }

          // Tạo serial number unique (optional)
          const serialNumber = `${template.componentType}-${computer.id.substring(0, 8)}-${Date.now()}`;

          // Insert component
          await queryRunner.manager.query(
            `INSERT INTO computer_components (
              "computerAssetId", "componentType", name, "componentSpecs",
              "serialNumber", status, "installedAt"
            )
            VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [
              computer.id, // Sử dụng computer.id thay vì computer.assetId
              template.componentType,
              template.name,
              template.componentSpecs,
              serialNumber,
              "INSTALLED", // ComponentStatus.INSTALLED
            ]
          );

          totalCreated++;
        } catch (error) {
          const err = error as Error;
          console.error(
            `   ❌ Error creating ${template.componentType} for ${computer.roomCode}-${computer.machineLabel}:`,
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
    console.log(`🖥️  Computers processed: ${processedComputers}`);
    console.log(`✅ Components created: ${totalCreated}`);
    console.log(`⏭️  Skipped (already exists): ${totalSkipped}`);
    console.log(`❌ Failed: ${totalErrors}`);
    console.log(
      `📍 Expected total: ${computers.length * COMPONENT_TEMPLATES.length} components`
    );
    console.log(
      `📊 Average per computer: ${COMPONENT_TEMPLATES.length} components`
    );
    console.log("=".repeat(70) + "\n");

    // ========== VERIFICATION ==========
    if (totalCreated > 0) {
      console.log("🔍 Verifying created components...\n");

      // Get sample computer with components
      const sampleComputer = await queryRunner.manager.query(
        `SELECT c.id, c."machineLabel", r."roomCode",
                COUNT(cc.id) as component_count
         FROM computers c
         JOIN rooms r ON c."roomId" = r.id
         LEFT JOIN computer_components cc ON c.id = cc."computerAssetId"
         WHERE r.building = $1
         GROUP BY c.id, c."machineLabel", r."roomCode", r.floor, r."roomNumber"
         ORDER BY r.floor, r."roomNumber", c."machineLabel"
         LIMIT 5`,
        [BUILDING]
      );

      console.log(`Sample computers with component counts:`);
      sampleComputer.forEach((comp, index) => {
        console.log(
          `   ${index + 1}. ${comp.roomCode} - Máy ${comp.machineLabel}: ${comp.component_count} components`
        );
      });
      console.log();

      // Get component type distribution
      const componentStats = await queryRunner.manager.query(
        `SELECT cc."componentType", COUNT(*) as count
         FROM computer_components cc
         JOIN computers c ON cc."computerAssetId" = c.id
         JOIN rooms r ON c."roomId" = r.id
         WHERE r.building = $1
         GROUP BY cc."componentType"
         ORDER BY count DESC`,
        [BUILDING]
      );

      console.log(`Component type distribution in Building ${BUILDING}:`);
      componentStats.forEach((stat, index) => {
        console.log(
          `   ${index + 1}. ${stat.componentType}: ${stat.count} units`
        );
      });
      console.log();

      // Total count verification
      const totalCount = await queryRunner.manager.query(
        `SELECT COUNT(*) as total
         FROM computer_components cc
         JOIN computers c ON cc."computerAssetId" = c.id
         JOIN rooms r ON c."roomId" = r.id
         WHERE r.building = $1`,
        [BUILDING]
      );
      console.log(
        `📊 Total components in Building ${BUILDING}: ${totalCount[0].total}\n`
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
seedComponentsBuildingH()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
