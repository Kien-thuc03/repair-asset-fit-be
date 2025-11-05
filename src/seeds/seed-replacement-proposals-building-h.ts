/**
 * SEED DATA SCRIPT - Replacement Proposals for Building H
 *
 * Script này tạo đề xuất thay thế linh kiện cho tòa H với:
 * - Các đề xuất từ giảng viên về thay thế linh kiện hỏng
 * - Liên kết với các computer components trong tầng H
 * - Các trạng thái khác nhau của quy trình duyệt
 *
 * Cách chạy:
 * 1. Đảm bảo đã có dữ liệu về rooms, computers, components trong tòa H
 * 2. Chạy: pnpm run seed:replacement-proposals-h
 *
 * Lưu ý: Script sẽ bỏ qua đề xuất đã tồn tại (dựa vào proposalCode)
 */

import { DataSource } from "typeorm";
import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables
config({ path: resolve(__dirname, "../../.env") });

// ========== CONFIGURATION ==========
const BUILDING = "H";

// ========== PROPOSAL DATA ==========
const PROPOSALS_DATA = [
  {
    title: "Đề xuất thay thế RAM máy tính phòng H.02",
    description:
      "RAM của máy 02 và máy 03 phòng H.02 thường xuyên gặp lỗi Blue Screen, ảnh hưởng đến giảng dạy. Đề nghị thay thế RAM mới với dung lượng 16GB để đáp ứng nhu cầu chạy phần mềm thiết kế.",
    proposalCode: "DXTT-H02-001-2024",
    status: "ĐÃ_DUYỆT",
    submissionFormUrl: "/uploads/proposals/h02-ram-replacement-form.pdf",
    items: [
      {
        componentType: "RAM",
        machineLabel: "02",
        roomNumber: "02",
        newItemName: "Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz",
        newItemSpecs: "DDR4, 16GB (2x8GB), 3200MHz, CL16, Non-ECC, DIMM, 1.35V",
        quantity: 1,
        reason:
          "RAM hiện tại (8GB) gặp lỗi Blue Screen thường xuyên, không đủ dung lượng cho phần mềm thiết kế đồ họa",
      },
      {
        componentType: "RAM",
        machineLabel: "03",
        roomNumber: "02",
        newItemName: "Kingston Fury Beast DDR4 16GB (2x8GB) 3200MHz",
        newItemSpecs: "DDR4, 16GB (2x8GB), 3200MHz, CL16, Non-ECC, DIMM, 1.35V",
        quantity: 1,
        reason:
          "RAM hiện tại không ổn định, gây crash khi chạy nhiều ứng dụng đồng thời",
      },
    ],
  },
  {
    title: "Đề xuất thay thế ổ cứng SSD phòng H.05",
    description:
      "Ổ cứng SSD của máy 02 phòng H.05 đã đầy dung lượng và có dấu hiệu hỏng hóc (thường xuyên mất dữ liệu, tốc độ đọc/ghi chậm). Đề nghị thay thế bằng ổ SSD dung lượng lớn hơn.",
    proposalCode: "DXTT-H05-002-2024",
    status: "CHỜ_XÁC_MINH",
    submissionFormUrl: "/uploads/proposals/h05-ssd-replacement-form.pdf",
    verificationReportUrl: null,
    items: [
      {
        componentType: "STORAGE",
        machineLabel: "02",
        roomNumber: "05",
        newItemName: "Samsung 980 PRO NVMe SSD 1TB",
        newItemSpecs:
          "NVMe PCIe Gen 4.0 x4, 1TB, Read: 7000MB/s, Write: 5000MB/s, M.2 2280",
        quantity: 1,
        reason:
          "Ổ cứng hiện tại (256GB) đã đầy, có dấu hiệu hỏng hóc, cần nâng cấp lên 1TB",
      },
    ],
  },
  {
    title: "Đề xuất thay thế màn hình Dell phòng H.02",
    description:
      "Màn hình của máy 02 và màn hình của máy 03 phòng H.02 bị mờ, xuất hiện các vệt sáng và không hiển thị màu chính xác. Ảnh hưởng nghiêm trọng đến công việc xem và chỉnh sửa hình ảnh.",
    proposalCode: "DXTT-H02-003-2024",
    status: "ĐÃ_HOÀN_TẤT_MUA_SẮM",
    submissionFormUrl: "/uploads/proposals/h02-monitor-replacement-form.pdf",
    verificationReportUrl:
      "/uploads/proposals/h02-monitor-verification-report.pdf",
    items: [
      {
        componentType: "MONITOR",
        machineLabel: "02",
        roomNumber: "02",
        newItemName: "Dell UltraSharp U2422H 24 inch",
        newItemSpecs:
          "24 inch, IPS, 1920x1080, 60Hz, 5ms, HDMI, DisplayPort, USB-C, Height Adjustable",
        quantity: 1,
        reason:
          "Màn hình hiện tại bị mờ, xuất hiện vệt sáng, không hiển thị màu chính xác",
      },
      {
        componentType: "MONITOR",
        machineLabel: "03",
        roomNumber: "02",
        newItemName: "Dell UltraSharp U2422H 24 inch",
        newItemSpecs:
          "24 inch, IPS, 1920x1080, 60Hz, 5ms, HDMI, DisplayPort, USB-C, Height Adjustable",
        quantity: 1,
        reason: "Màn hình hiện tại bị lỗi hiển thị, cần thay thế",
      },
    ],
  },
  {
    title: "Đề xuất thay thế bàn phím và chuột phòng H.02",
    description:
      "Bàn phím và chuột của máy 03 phòng H.02 đã cũ, nhiều phím không nhấn được, chuột bị kẹt. Ảnh hưởng đến hiệu suất làm việc của sinh viên và giảng viên.",
    proposalCode: "DXTT-H02-004-2024",
    status: "CHỜ_TỔ_TRƯỞNG_DUYỆT",
    submissionFormUrl: null,
    items: [
      {
        componentType: "KEYBOARD",
        machineLabel: "03",
        roomNumber: "02",
        newItemName: "Logitech K380 Multi-Device Bluetooth Keyboard",
        newItemSpecs:
          "Bluetooth, Multi-device (3 devices), Compact, Low-profile, Battery life: 2 years",
        quantity: 1,
        reason: "Bàn phím hiện tại đã cũ, nhiều phím không hoạt động",
      },
      {
        componentType: "MOUSE",
        machineLabel: "03",
        roomNumber: "02",
        newItemName: "Logitech M590 Silent Wireless Mouse",
        newItemSpecs:
          "Wireless, 2.4GHz + Bluetooth, Silent clicks, 1000 DPI, Battery life: 2 years",
        quantity: 1,
        reason: "Chuột hiện tại bị kẹt, không hoạt động trơn tru",
      },
    ],
  },
  {
    title: "Đề xuất thay thế nguồn máy tính phòng H.05",
    description:
      "Nguồn của máy 02 phòng H.05 có tiếng kêu lạ, thỉnh thoảng máy tính bị tắt đột ngột. Cần thay thế ngay để tránh hỏng các linh kiện khác.",
    proposalCode: "DXTT-H05-005-2024",
    status: "ĐÃ_TỪ_CHỐI",
    submissionFormUrl: "/uploads/proposals/h05-psu-replacement-form.pdf",
    items: [
      {
        componentType: "PSU",
        machineLabel: "02",
        roomNumber: "05",
        newItemName: "Cooler Master MWE 650W 80+ Bronze",
        newItemSpecs:
          "650W, 80+ Bronze, ATX 12V V2.31, Single +12V Rail, 120mm Fan, DC-DC Technology",
        quantity: 1,
        reason:
          "Nguồn hiện tại có tiếng kêu lạ, máy tính thỉnh thoảng tắt đột ngột",
      },
    ],
  },
  {
    title: "Đề xuất thay thế CPU và Mainboard phòng H.02",
    description:
      "CPU và mainboard của máy 03 phòng H.02 quá cũ, không đáp ứng được yêu cầu chạy các phần mềm mới. Đề nghị nâng cấp lên thế hệ CPU mới hơn.",
    proposalCode: "DXTT-H02-006-2024",
    status: "ĐÃ_LẬP_TỜ_TRÌNH",
    submissionFormUrl: "/uploads/proposals/h02-cpu-mb-replacement-form.pdf",
    items: [
      {
        componentType: "CPU",
        machineLabel: "03",
        roomNumber: "02",
        newItemName: "Intel Core i7-12700K",
        newItemSpecs:
          "12 cores (8P+4E), 20 threads, Base: 3.6GHz, Turbo: 5.0GHz, 25MB Cache, LGA1700, 125W",
        quantity: 1,
        reason:
          "CPU hiện tại (i5-12400) quá yếu cho các tác vụ render và xử lý đồ họa nặng",
      },
      {
        componentType: "MAINBOARD",
        machineLabel: "03",
        roomNumber: "02",
        newItemName: "ASUS TUF Gaming Z690-Plus WiFi D4",
        newItemSpecs:
          "LGA1700, ATX, DDR4, PCIe 5.0, WiFi 6, 2.5Gb LAN, USB 3.2 Gen 2x2, Aura Sync RGB",
        quantity: 1,
        reason:
          "Mainboard hiện tại không hỗ trợ CPU thế hệ mới, cần thay thế đồng bộ",
      },
    ],
  },
];

// ========== HELPER FUNCTIONS ==========
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ========== MAIN SEED FUNCTION ==========
async function seedReplacementProposalsH() {
  console.log(
    "🌱 Starting seed script for Replacement Proposals (Building H)...\n"
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

    // ========== STEP 1: Lấy users để gán làm proposer, team lead, admin ==========
    console.log("🔍 Fetching users for proposals...");

    // Lấy giảng viên
    const lecturers = await queryRunner.manager.query(
      `SELECT DISTINCT u.id, u.username, u."fullName"
       FROM users u
       JOIN user_roles ur ON u.id = ur."userId"
       JOIN roles r ON ur."roleId" = r.id
       WHERE r."name" = 'Giảng viên'
       LIMIT 5`
    );

    // Lấy tổ trưởng kỹ thuật
    const teamLeads = await queryRunner.manager.query(
      `SELECT DISTINCT u.id, u.username, u."fullName"
       FROM users u
       JOIN user_roles ur ON u.id = ur."userId"
       JOIN roles r ON ur."roleId" = r.id
       WHERE r."name" = 'Tổ trưởng Kỹ thuật'
       LIMIT 2`
    );

    // Lấy admin
    const admins = await queryRunner.manager.query(
      `SELECT DISTINCT u.id, u.username, u."fullName"
       FROM users u
       JOIN user_roles ur ON u.id = ur."userId"
       JOIN roles r ON ur."roleId" = r.id
       WHERE r."name" = 'Quản trị viên'
       LIMIT 2`
    );

    if (lecturers.length === 0) {
      console.error("❌ No lecturers found! Please seed users first.");
      return;
    }

    console.log(`✅ Found ${lecturers.length} lecturers`);
    console.log(`✅ Found ${teamLeads.length} team leads`);
    console.log(`✅ Found ${admins.length} admins\n`);

    // ========== STEP 2: Process each proposal ==========
    console.log("🏗️  Creating replacement proposals...\n");

    let totalCreated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalItemsCreated = 0;

    for (let i = 0; i < PROPOSALS_DATA.length; i++) {
      const proposalData = PROPOSALS_DATA[i];

      console.log(`\n📋 Processing: ${proposalData.proposalCode}`);

      try {
        // Kiểm tra proposal đã tồn tại chưa
        const existingProposal = await queryRunner.manager.query(
          `SELECT id FROM replacement_proposals WHERE "proposalCode" = $1`,
          [proposalData.proposalCode]
        );

        if (existingProposal.length > 0) {
          console.log(`   ⏭️  Skipped: Already exists`);
          totalSkipped++;
          continue;
        }

        // Chọn proposer (giảng viên)
        const proposer = lecturers[i % lecturers.length];

        // Chọn team lead và admin dựa vào status
        let teamLeadId = null;
        let adminId = null;

        if (
          ![
            "CHỜ_TỔ_TRƯỞNG_DUYỆT",
            "ĐÃ_TỪ_CHỐI",
            "ĐÃ_TỪ_CHỐI_TỜ_TRÌNH",
          ].includes(proposalData.status) &&
          teamLeads.length > 0
        ) {
          teamLeadId = teamLeads[i % teamLeads.length].id;
        }

        if (
          [
            "ĐÃ_XÁC_MINH",
            "ĐÃ_GỬI_BIÊN_BẢN",
            "ĐÃ_KÝ_BIÊN_BẢN",
            "ĐÃ_HOÀN_TẤT_MUA_SẮM",
          ].includes(proposalData.status) &&
          admins.length > 0
        ) {
          adminId = admins[i % admins.length].id;
        }

        // Tính ngày tạo (giả lập các đề xuất trong vài tháng gần đây)
        const createdAt = addDays(new Date(), -(60 - i * 10)); // Các đề xuất cách nhau 10 ngày

        // Tạo proposal
        const proposalResult = await queryRunner.manager.query(
          `INSERT INTO replacement_proposals (
            title, description, "proposalCode", "proposerId",
            "teamLeadApproverId", "adminVerifierId", status,
            "submissionFormUrl", "verificationReportUrl",
            "createdAt", "updatedAt"
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)
          RETURNING id`,
          [
            proposalData.title,
            proposalData.description,
            proposalData.proposalCode,
            proposer.id,
            teamLeadId,
            adminId,
            proposalData.status,
            proposalData.submissionFormUrl || null,
            proposalData.verificationReportUrl || null,
            createdAt,
          ]
        );

        const proposalId = proposalResult[0].id;
        console.log(`   ✅ Created proposal: ${proposalData.proposalCode}`);
        console.log(`      Proposer: ${proposer.fullName}`);
        totalCreated++;

        // ========== STEP 3: Tạo replacement items ==========
        for (const itemData of proposalData.items) {
          try {
            // Tìm component cũ theo componentType, machineLabel, roomNumber
            const oldComponents = await queryRunner.manager.query(
              `SELECT cc.id, cc."componentType", cc."name", cc."computerAssetId"
               FROM computer_components cc
               JOIN computers c ON cc."computerAssetId" = c.id
               JOIN rooms r ON c."roomId" = r.id
               WHERE cc."componentType" = $1
                 AND c."machineLabel" = $2
                 AND r."roomNumber" = $3
                 AND r."building" = $4
               LIMIT 1`,
              [
                itemData.componentType,
                itemData.machineLabel,
                itemData.roomNumber,
                BUILDING,
              ]
            );

            let oldComponentId = null;
            if (oldComponents.length > 0) {
              oldComponentId = oldComponents[0].id;
            }

            // Tạo replacement item
            await queryRunner.manager.query(
              `INSERT INTO replacement_items (
                "proposalId", "oldComponentId", "newItemName", "newItemSpecs",
                quantity, reason
              )
              VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                proposalId,
                oldComponentId,
                itemData.newItemName,
                itemData.newItemSpecs,
                itemData.quantity,
                itemData.reason,
              ]
            );

            console.log(
              `      ➕ Added item: ${itemData.componentType} for Máy ${itemData.machineLabel} (Room ${itemData.roomNumber})`
            );
            totalItemsCreated++;
          } catch (error) {
            const err = error as Error;
            console.error(
              `      ❌ Error creating item for ${itemData.componentType}:`,
              err.message
            );
          }
        }
      } catch (error) {
        const err = error as Error;
        console.error(`   ❌ Error creating proposal:`, err.message);
        totalErrors++;
      }
    }

    // ========== SUMMARY ==========
    console.log("\n" + "=".repeat(70));
    console.log("📊 SEED SUMMARY");
    console.log("=".repeat(70));
    console.log(`✅ Proposals created: ${totalCreated}`);
    console.log(`📦 Replacement items created: ${totalItemsCreated}`);
    console.log(`⏭️  Skipped (already exists): ${totalSkipped}`);
    console.log(`❌ Failed: ${totalErrors}`);
    console.log("=".repeat(70) + "\n");

    // ========== VERIFICATION ==========
    if (totalCreated > 0) {
      console.log("🔍 Verifying created proposals...\n");

      const verifyProposals = await queryRunner.manager.query(
        `SELECT 
          rp.id,
          rp."proposalCode",
          rp.title,
          rp.status,
          u."fullName" as proposer_name,
          COUNT(ri.id) as items_count
         FROM replacement_proposals rp
         JOIN users u ON rp."proposerId" = u.id
         LEFT JOIN replacement_items ri ON rp.id = ri."proposalId"
         GROUP BY rp.id, rp."proposalCode", rp.title, rp.status, u."fullName"
         ORDER BY rp."createdAt" DESC
         LIMIT 10`
      );

      console.log(`Sample of created proposals (showing last 10):`);
      verifyProposals.forEach((prop, index) => {
        console.log(
          `   ${index + 1}. ${prop.proposalCode} - ${prop.status} (${prop.items_count} items) - by ${prop.proposer_name}`
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
seedReplacementProposalsH()
  .then(() => {
    console.log("✅ Seed script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed script failed:", error);
    process.exit(1);
  });
