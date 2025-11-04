/**
 * SEED DATA SCRIPT - Software for Building H Computers
 * 
 * Script này tạo phần mềm và cài đặt cho 450 máy tính ở Tòa H
 * 
 * Cách chạy:
 * pnpm run seed:software-building-h
 * 
 * Cấu trúc khóa ngoại:
 * - asset_software.assetId → assets.id
 * - asset_software.softwareId → software.id
 * - computers.assetId → assets.id
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

const BUILDING = "H";

// Danh sách phần mềm
const SOFTWARE_LIST = [
  // Hệ điều hành
  { name: 'Windows 10 Pro', version: '22H2', publisher: 'Microsoft Corporation' },
  { name: 'Windows 11 Pro', version: '23H2', publisher: 'Microsoft Corporation' },
  { name: 'Ubuntu Desktop', version: '22.04 LTS', publisher: 'Canonical Ltd.' },
  
  // Office Suite
  { name: 'Microsoft Office 365', version: '2021', publisher: 'Microsoft Corporation' },
  { name: 'LibreOffice', version: '7.6', publisher: 'The Document Foundation' },
  { name: 'WPS Office', version: '11.2', publisher: 'Kingsoft Office Software' },
  
  // IDE & Development
  { name: 'Visual Studio Code', version: '1.85', publisher: 'Microsoft Corporation' },
  { name: 'Visual Studio 2022', version: 'Community', publisher: 'Microsoft Corporation' },
  { name: 'IntelliJ IDEA', version: '2023.3', publisher: 'JetBrains' },
  { name: 'PyCharm', version: '2023.3', publisher: 'JetBrains' },
  { name: 'Eclipse IDE', version: '2023-12', publisher: 'Eclipse Foundation' },
  { name: 'NetBeans', version: '19', publisher: 'Apache Software Foundation' },
  
  // Runtime
  { name: 'Node.js', version: '20.10 LTS', publisher: 'Node.js Foundation' },
  { name: 'Python', version: '3.12', publisher: 'Python Software Foundation' },
  { name: 'Java JDK', version: '21', publisher: 'Oracle Corporation' },
  { name: '.NET SDK', version: '8.0', publisher: 'Microsoft Corporation' },
  
  // Database
  { name: 'MySQL Workbench', version: '8.0', publisher: 'Oracle Corporation' },
  { name: 'PostgreSQL', version: '16.1', publisher: 'PostgreSQL Global Development Group' },
  { name: 'MongoDB Compass', version: '1.41', publisher: 'MongoDB Inc.' },
  { name: 'SQL Server Management Studio', version: '19.3', publisher: 'Microsoft Corporation' },
  
  // Design
  { name: 'Adobe Photoshop', version: 'CC 2024', publisher: 'Adobe Inc.' },
  { name: 'Adobe Illustrator', version: 'CC 2024', publisher: 'Adobe Inc.' },
  { name: 'Figma Desktop', version: '116.16', publisher: 'Figma Inc.' },
  { name: 'GIMP', version: '2.10', publisher: 'GIMP Development Team' },
  { name: 'Inkscape', version: '1.3', publisher: 'Inkscape Project' },
  
  // Tools
  { name: 'Git', version: '2.43', publisher: 'Git Community' },
  { name: 'Docker Desktop', version: '4.26', publisher: 'Docker Inc.' },
  { name: 'Postman', version: '10.20', publisher: 'Postman Inc.' },
  { name: 'FileZilla', version: '3.66', publisher: 'Tim Kosse' },
  { name: 'WinRAR', version: '6.24', publisher: 'RARLAB' },
  { name: '7-Zip', version: '23.01', publisher: 'Igor Pavlov' },
  
  // Browsers
  { name: 'Google Chrome', version: '120.0', publisher: 'Google LLC' },
  { name: 'Mozilla Firefox', version: '121.0', publisher: 'Mozilla Foundation' },
  { name: 'Microsoft Edge', version: '120.0', publisher: 'Microsoft Corporation' },
  
  // Security
  { name: 'Windows Defender', version: 'Built-in', publisher: 'Microsoft Corporation' },
  { name: 'Kaspersky Endpoint Security', version: '11.10', publisher: 'Kaspersky Lab' },
  
  // Communication
  { name: 'Microsoft Teams', version: '1.6', publisher: 'Microsoft Corporation' },
  { name: 'Zoom', version: '5.16', publisher: 'Zoom Video Communications' },
  { name: 'Discord', version: '1.0.9027', publisher: 'Discord Inc.' },
  
  // Other
  { name: 'VLC Media Player', version: '3.0.20', publisher: 'VideoLAN' },
  { name: 'Adobe Acrobat Reader', version: 'DC 2023', publisher: 'Adobe Inc.' },
  { name: 'Notepad++', version: '8.6', publisher: 'Don Ho' },
];

// Phần mềm bắt buộc (tất cả máy đều có)
const MANDATORY_SOFTWARE = [
  'Windows 10 Pro',
  'Windows 11 Pro',
  'Google Chrome',
  'Windows Defender',
  'Microsoft Office 365',
  'Visual Studio Code',
];

async function seedSoftwareBuildingH() {
  console.log("🚀 Starting seed for Software - Building H...\n");

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
    console.log("✅ Database connected\n");

    const queryRunner = dataSource.createQueryRunner();

    // STEP 1: Tạo phần mềm
    console.log("📦 Creating software entries...");
    
    const createdSoftwareIds: { [key: string]: string } = {};

    for (const sw of SOFTWARE_LIST) {
      // Check if exists
      const existing = await queryRunner.manager.query(
        `SELECT id FROM software WHERE name = $1 AND version = $2 AND "deletedAt" IS NULL`,
        [sw.name, sw.version]
      );

      if (existing.length > 0) {
        console.log(`  ⏭️  Exists: ${sw.name} ${sw.version}`);
        createdSoftwareIds[sw.name] = existing[0].id;
      } else {
        const result = await queryRunner.manager.query(
          `INSERT INTO software (name, version, publisher, "createdAt", "updatedAt")
           VALUES ($1, $2, $3, NOW(), NOW())
           RETURNING id`,
          [sw.name, sw.version, sw.publisher]
        );
        createdSoftwareIds[sw.name] = result[0].id;
        console.log(`  ✅ Created: ${sw.name} ${sw.version}`);
      }
    }

    console.log(`\n✅ Total software: ${Object.keys(createdSoftwareIds).length}`);

    // STEP 2: Lấy tất cả computers từ Building H
    console.log("\n🏢 Fetching computers from Building H...");
    
    const computers = await queryRunner.manager.query(
      `SELECT c.id as computer_id, c."assetId" as asset_id, r."roomCode", c."machineLabel"
       FROM computers c
       JOIN rooms r ON c."roomId" = r.id
       WHERE r."roomCode" LIKE 'H.%'
       ORDER BY r."roomCode", c."machineLabel"`
    );

    console.log(`✅ Found ${computers.length} computers\n`);

    // STEP 3: Cài đặt phần mềm cho từng máy
    console.log("💾 Installing software on computers...");

    let totalInstallations = 0;
    const installationDate = new Date('2024-01-15');

    for (let i = 0; i < computers.length; i++) {
      const computer = computers[i];
      const assetId = computer.asset_id;

      // Chọn OS (Windows 10 hoặc 11)
      const osName = Math.random() > 0.5 ? 'Windows 10 Pro' : 'Windows 11 Pro';
      const osId = createdSoftwareIds[osName];

      // Danh sách phần mềm cho máy này
      const softwareIds: string[] = [osId];

      // Thêm các mandatory software khác
      MANDATORY_SOFTWARE.forEach(name => {
        if (!name.includes('Windows') || name === osName) {
          if (createdSoftwareIds[name]) {
            softwareIds.push(createdSoftwareIds[name]);
          }
        }
      });

      // Chọn ngẫu nhiên 3-7 phần mềm tùy chọn
      const optionalSoftware = SOFTWARE_LIST
        .filter(sw => !MANDATORY_SOFTWARE.includes(sw.name))
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 5) + 3);

      optionalSoftware.forEach(sw => {
        if (createdSoftwareIds[sw.name]) {
          softwareIds.push(createdSoftwareIds[sw.name]);
        }
      });

      // Loại bỏ duplicate
      const uniqueSoftwareIds = [...new Set(softwareIds)];

      // Insert asset_software
      for (const softwareId of uniqueSoftwareIds) {
        // Check if exists
        const existing = await queryRunner.manager.query(
          `SELECT 1 FROM asset_software 
           WHERE "assetId" = $1 AND "softwareId" = $2`,
          [assetId, softwareId]
        );

        if (existing.length === 0) {
          await queryRunner.manager.query(
            `INSERT INTO asset_software ("assetId", "softwareId", "installationDate", notes)
             VALUES ($1, $2, $3, $4)`,
            [assetId, softwareId, installationDate, `Cài đặt ban đầu cho ${computer.roomCode} - Máy ${computer.machineLabel}`]
          );
          totalInstallations++;
        }
      }

      // Progress log
      if ((i + 1) % 50 === 0 || i === computers.length - 1) {
        console.log(`  📊 Progress: ${i + 1}/${computers.length} computers (${totalInstallations} installations)`);
      }
    }

    console.log("\n✅ Software installation completed!");
    console.log(`📊 Summary:`);
    console.log(`   - Total software types: ${Object.keys(createdSoftwareIds).length}`);
    console.log(`   - Total computers: ${computers.length}`);
    console.log(`   - Total installations: ${totalInstallations}`);
    console.log(`   - Average per computer: ${(totalInstallations / computers.length).toFixed(1)} software`);

    // Verification
    console.log("\n🔍 Verification:");

    const totalSoftware = await queryRunner.manager.query(
      `SELECT COUNT(*) as total FROM software WHERE "deletedAt" IS NULL`
    );
    console.log(`   - Total software in database: ${totalSoftware[0].total}`);

    const totalInstallationsCheck = await queryRunner.manager.query(
      `SELECT COUNT(*) as total 
       FROM asset_software asw
       JOIN computers c ON asw."assetId" = c."assetId"
       JOIN rooms r ON c."roomId" = r.id
       WHERE r."roomCode" LIKE 'H.%'`
    );
    console.log(`   - Total installations in Building H: ${totalInstallationsCheck[0].total}`);

    const sampleComputers = await queryRunner.manager.query(
      `SELECT 
        c."assetId",
        a.name as asset_name,
        r."roomCode",
        c."machineLabel",
        COUNT(asw."softwareId") as software_count
       FROM computers c
       JOIN assets a ON c."assetId" = a.id
       JOIN rooms r ON c."roomId" = r.id
       LEFT JOIN asset_software asw ON c."assetId" = asw."assetId"
       WHERE r."roomCode" LIKE 'H.%'
       GROUP BY c."assetId", a.name, r."roomCode", c."machineLabel"
       ORDER BY software_count
       LIMIT 5`
    );

    console.log("\n   - Sample computers with software count:");
    sampleComputers.forEach((row: any) => {
      console.log(`     ${row.roomCode} - Máy ${row.machineLabel}: ${row.software_count} software`);
    });

    console.log("\n🎉 Seed completed successfully!");

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
seedSoftwareBuildingH()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
