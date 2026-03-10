/**
 * SEED DATA SCRIPT - Asset <-> Software
 *
 * Mục tiêu:
 * - Tạo 2-3 bản ghi `software`
 * - Tạo 2-3 bản ghi `assets` (loại máy tính) phù hợp với bảng `assets`
 * - Tạo quan hệ đồng bộ trong bảng `asset_software` (composite PK)
 *
 * Cách dùng:
 *  - Đảm bảo .env đúng (DB_HOST/DB_PORT/DB_USERNAME/DB_PASSWORD/DB_NAME)
 *  - Chạy: npm run seed:asset-software  (hoặc node -r ts-node/register src/seeds/seed-asset-software.ts)
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import * as bcrypt from "bcryptjs";
import { resolve } from "path";

config({ path: resolve(__dirname, "../../.env") });

// Seed sample data - change values if you want different test cases
const SOFTS = [
  { name: "Microsoft Office 2021", version: "2021", publisher: "Microsoft" },
  { name: "Visual Studio Code", version: "1.89", publisher: "Microsoft" },
  { name: "AutoCAD", version: "2024", publisher: "Autodesk" },
];

// We'll resolve a real category UUID at runtime (category 'Máy tính' / code '4')
const ASSETS = [
  {
    ktCode: "KT-2025-0001",
    fixedCode: "FC-0001",
    name: "Desktop Test A",
    specs: "Intel i5, 8GB RAM, 256GB SSD",
    entrydate: new Date().toISOString().slice(0, 10),
    currentRoomId: null,
    unit: "cái",
    quantity: 1,
    origin: "VN",
    purchasePackage: 1,
    type: "FIXED_ASSET",
    categoryId: "4", // placeholder - will be replaced by real UUID at runtime
    status: "WAITING_ALLOCATION",
    shape: "COMPUTER",
    allowMove: true,
    createdBy: "system-seed",
  },
  {
    ktCode: "KT-2025-0002",
    fixedCode: "FC-0002",
    name: "Laptop Test B",
    specs: "Intel i7, 16GB RAM, 512GB SSD",
    entrydate: new Date().toISOString().slice(0, 10),
    currentRoomId: null,
    unit: "cái",
    quantity: 1,
    origin: "JP",
    purchasePackage: 1,
    type: "FIXED_ASSET",
    categoryId: "4",
    status: "WAITING_ALLOCATION",
    shape: "COMPUTER",
    allowMove: true,
    createdBy: "system-seed",
  },
];

async function seedAssetSoftware() {
  console.log("🌱 Starting seed script for Asset-Software relationships...");

  const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432", 10),
    username: process.env.DB_USERNAME,
    password: String(process.env.DB_PASSWORD),
    database: process.env.DB_NAME,
    entities: [],
    synchronize: false,
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
  });

  try {
    await AppDataSource.initialize();
    console.log("✅ Database connection established");

    const qr = AppDataSource.createQueryRunner();

    // Resolve category UUID for 'Máy tính' (code '4' in FE mock data). If not present, create it.
    console.log("🔎 Resolving category for computers...");
    let categoryIdUuid: string | null = null;

    // Try several heuristics to find existing category
    const findCategoryQueries = [
      { sql: "SELECT id FROM categories WHERE id = $1", params: ["4"] },
      { sql: "SELECT id FROM categories WHERE code = $1", params: ["4"] },
      {
        sql: "SELECT id FROM categories WHERE LOWER(name) LIKE LOWER($1) LIMIT 1",
        params: ["%máy tính%"],
      },
      {
        sql: "SELECT id FROM categories WHERE LOWER(name) LIKE LOWER($1) LIMIT 1",
        params: ["%computer%"],
      },
    ];

    for (const q of findCategoryQueries) {
      try {
        const found = await qr.manager.query(q.sql, q.params);
        if (found && found.length > 0) {
          categoryIdUuid = found[0].id;
          console.log(`  ✅ Found category id: ${categoryIdUuid}`);
          break;
        }
      } catch (err) {
        // ignore individual query errors and continue with other heuristics
      }
    }

    if (!categoryIdUuid) {
      console.log('  ⚠️  No existing "Máy tính" category found - creating one');
      const res = await qr.manager.query(
        'INSERT INTO categories (code, name, "createdAt", "updatedAt") VALUES ($1, $2, NOW(), NOW()) RETURNING id',
        ["4", "Máy tính"]
      );
      categoryIdUuid = res[0].id;
      console.log(`  ✅ Created category with id: ${categoryIdUuid}`);
    }

    // Replace placeholder categoryId in ASSETS with resolved UUID
    for (const a of ASSETS) {
      a.categoryId = categoryIdUuid as string;
    }

    // Resolve a valid createdBy user id for assets (created_by is a FK to users.id UUID)
    console.log("🔎 Resolving a user to set as created_by for assets...");
    let createdById: string | null = null;

    try {
      // Prefer admin user created by other seed
      const admin = await qr.manager.query(
        "SELECT id FROM users WHERE username = $1 LIMIT 1",
        ["21012345"]
      );
      if (admin.length > 0) {
        createdById = admin[0].id;
        console.log(`  ✅ Using admin user id: ${createdById}`);
      } else {
        const anyUser = await qr.manager.query("SELECT id FROM users LIMIT 1");
        if (anyUser.length > 0) {
          createdById = anyUser[0].id;
          console.log(`  ✅ Using existing user id: ${createdById}`);
        }
      }

      if (!createdById) {
        console.log("  ⚠️  No users found - creating a fallback seed user");
        const hashed = await bcrypt.hash("seedpassword", 10);
        const res = await qr.manager.query(
          `INSERT INTO users (username, password, "fullName", status, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,NOW(),NOW()) RETURNING id`,
          ["seed-system", hashed, "Seed System", "ACTIVE"]
        );
        createdById = res[0].id;
        console.log(`  ✅ Created fallback user id: ${createdById}`);
      }
    } catch (err) {
      console.warn(
        "  ⚠️  Could not resolve or create a user for created_by:",
        err
      );
      throw err;
    }

    // Set createdBy in ASSETS objects
    for (const a of ASSETS) {
      a.createdBy = createdById as string;
    }

    // Insert or reuse softwares
    const softwareIds: string[] = [];

    for (const s of SOFTS) {
      const existing = await qr.manager.query(
        "SELECT id FROM software WHERE name = $1 AND version = $2",
        [s.name, s.version]
      );
      if (existing.length > 0) {
        console.log(`  ⏭️  Software exists: ${s.name} ${s.version}`);
        softwareIds.push(existing[0].id);
      } else {
        const res = await qr.manager.query(
          'INSERT INTO software (name, version, publisher, "createdAt", "updatedAt") VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id',
          [s.name, s.version, s.publisher]
        );
        softwareIds.push(res[0].id);
        console.log(`  ✅ Created software: ${s.name} ${s.version}`);
      }
    }

    // Insert or reuse assets
    const assetIds: string[] = [];

    for (const a of ASSETS) {
      // Try to find by fixed_code or kt_code
      const existing = await qr.manager.query(
        "SELECT id FROM assets WHERE fixed_code = $1 OR kt_code = $2",
        [a.fixedCode, a.ktCode]
      );
      if (existing.length > 0) {
        console.log(`  ⏭️  Asset exists: ${a.name}`);
        assetIds.push(existing[0].id);
      } else {
        const res = await qr.manager.query(
          `INSERT INTO assets (kt_code, fixed_code, name, specs, entrydate, current_room_id, unit, quantity, origin, purchase_package, type, category_id, status, shape, allow_move, created_by, created_at, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW()) RETURNING id`,
          [
            a.ktCode,
            a.fixedCode,
            a.name,
            a.specs,
            a.entrydate,
            a.currentRoomId,
            a.unit,
            a.quantity,
            a.origin,
            a.purchasePackage,
            a.type,
            a.categoryId,
            a.status,
            a.shape,
            a.allowMove,
            a.createdBy,
          ]
        );
        assetIds.push(res[0].id);
        console.log(`  ✅ Created asset: ${a.name}`);
      }
    }

    // Create asset_software relationships (map first asset to all softwares, second asset to first software)
    console.log("\n🔗 Creating asset_software relationships...");

    // first asset -> all softwares
    const firstAsset = assetIds[0];
    for (const sid of softwareIds) {
      const exists = await qr.manager.query(
        'SELECT * FROM asset_software WHERE "assetId" = $1 AND "softwareId" = $2',
        [firstAsset, sid]
      );
      if (exists.length > 0) {
        console.log(
          `  ⏭️  Relationship exists: asset ${firstAsset} - software ${sid}`
        );
      } else {
        await qr.manager.query(
          'INSERT INTO asset_software ("assetId", "softwareId", "installationDate", "notes") VALUES ($1, $2, $3, $4)',
          [
            firstAsset,
            sid,
            new Date().toISOString().slice(0, 10),
            "seeded relationship",
          ]
        );
        console.log(`  ✅ Linked asset ${firstAsset} -> software ${sid}`);
      }
    }

    // second asset -> first software only
    if (assetIds.length > 1 && softwareIds.length > 0) {
      const secondAsset = assetIds[1];
      const sid = softwareIds[0];
      const exists = await qr.manager.query(
        'SELECT * FROM asset_software WHERE "assetId" = $1 AND "softwareId" = $2',
        [secondAsset, sid]
      );
      if (exists.length > 0) {
        console.log(
          `  ⏭️  Relationship exists: asset ${secondAsset} - software ${sid}`
        );
      } else {
        await qr.manager.query(
          'INSERT INTO asset_software ("assetId", "softwareId", "installationDate", "notes") VALUES ($1, $2, $3, $4)',
          [
            secondAsset,
            sid,
            new Date().toISOString().slice(0, 10),
            "seeded relationship",
          ]
        );
        console.log(`  ✅ Linked asset ${secondAsset} -> software ${sid}`);
      }
    }

    console.log("\n🎉 Asset-Software seed completed");

    await AppDataSource.destroy();
  } catch (error) {
    console.error("❌ Error during Asset-Software seeding:", error);
    process.exit(1);
  }
}

// Execute
seedAssetSoftware()
  .then(() => {
    console.log("✅ Seed finished");
    process.exit(0);
  })
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  });
