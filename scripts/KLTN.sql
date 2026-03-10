CREATE TYPE "UserStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE "AssetType" AS ENUM (
  'TSCD',
  'CCDC'
);

CREATE TYPE "AssetStatus" AS ENUM (
  'đang_sử_dụng',
  'chờ_bàn_giao',
  'chờ_tiếp_nhận',
  'hư_hỏng',
  'đã_mất',
  'đề_xuất_thanh_lý',
  'đã_thanh_lý'
);

CREATE TYPE "TransactionType" AS ENUM (
  'Transfer'
);

CREATE TYPE "TransactionStatus" AS ENUM (
  'Pending',
  'Approved',
  'Rejected'
);

CREATE TYPE "UnitStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE "UnitType" AS ENUM (
  'co_so',
  'phòng_quản_trị',
  'đơn_vị_sử_dụng'
);

CREATE TYPE "RoomStatus" AS ENUM (
  'ACTIVE',
  'INACTIVE'
);

CREATE TYPE "BookStatus" AS ENUM (
  'OPEN',
  'CLOSE'
);

CREATE TYPE "AssetBookItemStatus" AS ENUM (
  'IN_USE',
  'TRANSFERRED',
  'LIQUIDATED',
  'MISSING'
);

CREATE TYPE "InventorySessionStatus" AS ENUM (
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CLOSED'
);

CREATE TYPE "InventoryCommitteeRole" AS ENUM (
  'SUB_COMMITTEE_LEADER',
  'VICE_SUB_COMMITTEE_LEADER',
  'LEADER',
  'DEPUTY_LEADER',
  'CHAIR',
  'VICE_CHAIR',
  'CHIEF_SECRETARY',
  'MEMBER',
  'SECRETARY'
);

CREATE TYPE "ScanMethod" AS ENUM (
  'RFID',
  'MANUAL'
);

CREATE TYPE "InventoryResultStatus" AS ENUM (
  'MATCHED',
  'MISSING',
  'EXCESS',
  'BROKEN',
  'NEEDS_REPAIR',
  'LIQUIDATION_PROPOSED'
);

CREATE TYPE "AlertStatus" AS ENUM (
  'PENDING',
  'RESOLVED'
);

CREATE TYPE "AlertType" AS ENUM (
  'UNAUTHORIZED_MOVEMENT'
);

CREATE TYPE "AlertResolutionStatus" AS ENUM (
  'CONFIRMED',
  'FALSE_ALARM',
  'SYSTEM_ERROR'
);

CREATE TYPE "DameReportStatus" AS ENUM (
  'REPORTED',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "LiquidationStatus" AS ENUM (
  'PROPOSED',
  'APPROVED',
  'REJECTED'
);

CREATE TYPE "LiquidationProposalItem" AS ENUM (
  'DAMAGED',
  'UNUSABLE'
);

CREATE TYPE "RepairStatus" AS ENUM (
  'CHỜ_TIẾP_NHẬN',
  'ĐÃ_TIẾP_NHẬN',
  'ĐANG_XỬ_LÝ',
  'CHỜ_THAY_THẾ',
  'ĐÃ_HOÀN_THÀNH',
  'ĐÃ_HỦY'
);

CREATE TYPE "ReplacementStatus" AS ENUM (
  'CHỜ_TỔ_TRƯỞNG_DUYỆT',
  'ĐÃ_DUYỆT',
  'ĐÃ_TỪ_CHỐI',
  'ĐÃ_LẬP_TỜ_TRÌNH',
  'ĐÃ_DUYỆT_TỜ_TRÌNH',
  'ĐÃ_TỪ_CHỐI_TỜ_TRÌNH',
  'CHỜ_XÁC_MINH',
  'ĐÃ_XÁC_MINH',
  'ĐÃ_GỬI_BIÊN_BẢN',
  'ĐÃ_KÝ_BIÊN_BẢN',
  'ĐÃ_HOÀN_TẤT_MUA_SẮM'
);

CREATE TYPE "AssetShape" AS ENUM (
  'COMPUTER',
  'GENERIC'
);

CREATE TYPE "ComponentStatus" AS ENUM (
  'INSTALLED',
  'FAULTY',
  'REMOVED',
  'IN_STOCK'
);

CREATE TYPE "ComponentType" AS ENUM (
  'CPU',
  'RAM',
  'MAINBOARD',
  'STORAGE',
  'GPU',
  'PSU',
  'CASE',
  'MONITOR',
  'KEYBOARD',
  'MOUSE',
  'NETWORK',
  'OPTICAL_DRIVE',
  'COOLER',
  'UPS',
  'OTHER',
  'NETWORK_CARD',
  'SOUND_CARD',
  'SPEAKER',
  'WEBCAM'
);

CREATE TYPE "SoftwareProposalStatus" AS ENUM (
  'CHỜ_DUYỆT',
  'ĐÃ_DUYỆT',
  'ĐÃ_TỪ_CHỐI',
  'ĐÃ_TRANG_BỊ'
);

CREATE TABLE "roles" (
  "id" string PRIMARY KEY,
  "name" string NOT NULL,
  "code" string UNIQUE
);

CREATE TABLE "permissions" (
  "id" string PRIMARY KEY,
  "name" string NOT NULL,
  "code" string UNIQUE
);

CREATE TABLE "roles_permissions" (
  "roleId" string NOT NULL,
  "permissionId" string NOT NULL
);

CREATE TABLE "users" (
  "id" string PRIMARY KEY,
  "username" string UNIQUE NOT NULL,
  "password" string NOT NULL,
  "fullName" string NOT NULL,
  "email" string UNIQUE NOT NULL,
  "unitId" string,
  "phoneNumber" string,
  "birthDate" date,
  "status" "UserStatus",
  "createdAt" timestamp,
  "updatedAt" timestamp,
  "deletedAt" timestamp
);

CREATE TABLE "users_roles" (
  "roleId" string NOT NULL,
  "userId" string NOT NULL
);

CREATE TABLE "rfidTags" (
  "rfidId" string PRIMARY KEY,
  "assetId" string NOT NULL,
  "assignedDate" string NOT NULL
);

CREATE TABLE "assetTransactions" (
  "id" string PRIMARY KEY,
  "type" "TransactionType",
  "fromUnitId" string,
  "toUnitId" string,
  "fromRoomId" string,
  "toRoomId" string,
  "createdBy" string,
  "createdAt" datetime,
  "approvedBy" string,
  "approvedAt" datetime,
  "status" "TransactionStatus",
  "note" string
);

CREATE TABLE "assetTransactionItems" (
  "id" string PRIMARY KEY,
  "transactionId" string,
  "assetId" string,
  "note" string
);

CREATE TABLE "units" (
  "id" string PRIMARY KEY,
  "name" string,
  "phone" string,
  "email" string,
  "type" "UnitType",
  "representativeId" string NOT NULL,
  "status" "UnitStatus",
  "createdBy" string NOT NULL,
  "createdAt" date,
  "updatedAt" date,
  "deletedAt" date
);

CREATE TABLE "rooms" (
  "id" string PRIMARY KEY,
  "building" string,
  "floor" string,
  "roomNumber" string,
  "status" "RoomStatus",
  "unitId" string
);

CREATE TABLE "categories" (
  "id" string PRIMARY KEY,
  "name" string,
  "code" string,
  "parentId" string
);

CREATE TABLE "assetBooks" (
  "id" string PRIMARY KEY,
  "unitId" string,
  "year" int,
  "createdBy" string,
  "createdAt" datetime,
  "lockedAt" datetime,
  "status" "BookStatus"
);

CREATE TABLE "assetBookItems" (
  "id" string PRIMARY KEY,
  "bookId" string,
  "assetId" string,
  "roomId" string,
  "assignedAt" datetime,
  "quantity" int,
  "status" "AssetBookItemStatus",
  "note" string
);

CREATE TABLE "fileUrls" (
  "id" string PRIMARY KEY,
  "url" string
);

CREATE TABLE "inventorySessions" (
  "id" string PRIMARY KEY,
  "year" int,
  "name" string,
  "period" int,
  "isGlobal" bool DEFAULT false,
  "startDate" date,
  "endDate" date,
  "status" "InventorySessionStatus",
  "createdBy" string,
  "createdAt" datetime
);

CREATE TABLE "fileUrls_inventorySessions" (
  "inventorySessionId" string,
  "fileUrlId" string
);

CREATE TABLE "inventorySessionUnits" (
  "id" string PRIMARY KEY,
  "sessionId" string,
  "unitId" string
);

CREATE TABLE "inventoryCommittees" (
  "id" string PRIMARY KEY,
  "sessionId" string,
  "name" string,
  "createdAt" datetime
);

CREATE TABLE "inventoryCommitteeMembers" (
  "id" string PRIMARY KEY,
  "committeeId" string,
  "userId" string,
  "responsibility" string,
  "role" "InventoryCommitteeRole"
);

CREATE TABLE "inventorySubCommittees" (
  "id" string PRIMARY KEY,
  "committeeId" string,
  "name" string,
  "leaderId" string,
  "secretaryId" string,
  "createdAt" datetime
);

CREATE TABLE "inventoryGroups" (
  "id" string PRIMARY KEY,
  "subCommitteeId" string,
  "name" string,
  "leaderId" string,
  "secretaryId" string,
  "createdAt" datetime
);

CREATE TABLE "inventoryGroupMembers" (
  "id" string PRIMARY KEY,
  "groupId" string,
  "userId" string,
  "role" "InventoryCommitteeRole"
);

CREATE TABLE "inventoryGroupAssignments" (
  "id" string PRIMARY KEY,
  "groupId" string,
  "unitId" string,
  "startDate" date,
  "endDate" date,
  "note" string
);

CREATE TABLE "inventoryResults" (
  "id" string PRIMARY KEY,
  "assignmentId" string,
  "assetId" string,
  "systemQuantity" int NOT NULL DEFAULT 1,
  "countedQuantity" int NOT NULL DEFAULT 0,
  "scanMethod" "ScanMethod",
  "status" "InventoryResultStatus",
  "note" string,
  "createdAt" datetime
);

CREATE TABLE "alerts" (
  "id" string PRIMARY KEY,
  "assetId" string,
  "detectedAt" datetime,
  "roomId" string,
  "type" "AlertType",
  "status" "AlertStatus",
  "createdAt" datetime
);

CREATE TABLE "alertResolutions" (
  "id" string PRIMARY KEY,
  "alertId" string,
  "resolverId" string,
  "resolution" "AlertResolutionStatus",
  "note" string,
  "resolvedAt" datetime
);

CREATE TABLE "damageReports" (
  "id" string PRIMARY KEY,
  "assetId" string,
  "reporter" string,
  "roomId" string,
  "description" text,
  "mediaUrl" string,
  "status" "DameReportStatus" DEFAULT 'REPORTED',
  "createdAt" datetime,
  "updatedAt" datetime
);

CREATE TABLE "LiquidationProposals" (
  "id" string PRIMARY KEY,
  "proposerId" string,
  "unitId" string,
  "reason" text,
  "status" "LiquidationStatus",
  "createdAt" datetime,
  "updatedAt" datetime
);

CREATE TABLE "LiquidationProposalItems" (
  "id" string PRIMARY KEY,
  "proposalId" string,
  "assetId" string,
  "reason" text,
  "condition" "LiquidationProposalItem",
  "mediaUrl" string
);

CREATE TABLE "technicianAssignments" (
  "technicianId" string NOT NULL,
  "building" string NOT NULL,
  "floor" string,
  PRIMARY KEY ("technicianId", "building", "floor")
);

CREATE TABLE "assets" (
  "id" string PRIMARY KEY,
  "ktCode" string,
  "fixedCode" string,
  "name" string NOT NULL,
  "specs" string,
  "entrydate" date NOT NULL,
  "currentRoomId" string,
  "unit" string NOT NULL,
  "quantity" int DEFAULT 1,
  "origin" string,
  "purchasePackage" int NOT NULL DEFAULT 0,
  "type" "AssetType" NOT NULL,
  "isHandover" boolean NOT NULL DEFAULT false,
  "isLocked" boolean NOT NULL DEFAULT false,
  "categoryId" string NOT NULL,
  "shape" "AssetShape" NOT NULL DEFAULT 'GENERIC',
  "status" "AssetStatus" DEFAULT 'chờ_bàn_giao',
  "createdBy" string NOT NULL,
  "createdAt" timestamp,
  "updatedAt" timestamp,
  "deletedAt" timestamp
);

CREATE TABLE "errorTypes" (
  "id" string PRIMARY KEY,
  "name" string UNIQUE NOT NULL,
  "description" text,
  "createdAt" timestamp
);

CREATE TABLE "repairRequests" (
  "id" string PRIMARY KEY,
  "requestCode" string UNIQUE NOT NULL,
  "computerAssetId" string NOT NULL,
  "reporterId" string NOT NULL,
  "assignedTechnicianId" string,
  "errorTypeId" string,
  "description" text NOT NULL,
  "mediaUrls" string,
  "status" "RepairStatus" NOT NULL DEFAULT 'CHỜ_TIẾP_NHẬN',
  "resolutionNotes" text,
  "createdAt" timestamp,
  "acceptedAt" timestamp,
  "completedAt" timestamp
);

CREATE TABLE "repairRequestComponents" (
  "repairRequestId" string NOT NULL,
  "componentId" string NOT NULL,
  "note" text,
  PRIMARY KEY ("repairRequestId", "componentId")
);

CREATE TABLE "repairLogs" (
  "id" string PRIMARY KEY,
  "repairRequestId" string NOT NULL,
  "actorId" string NOT NULL,
  "action" string NOT NULL,
  "fromStatus" "RepairStatus",
  "toStatus" "RepairStatus",
  "comment" text,
  "createdAt" timestamp
);

CREATE TABLE "replacementProposals" (
  "id" string PRIMARY KEY,
  "title" string,
  "description" string,
  "proposalCode" string UNIQUE NOT NULL,
  "proposerId" string NOT NULL,
  "teamLeadApproverId" string,
  "adminVerifierId" string,
  "status" "ReplacementStatus" NOT NULL DEFAULT 'CHỜ_TỔ_TRƯỞNG_DUYỆT',
  "submissionFormUrl" string,
  "verificationReportUrl" string,
  "createdAt" timestamp,
  "updatedAt" timestamp
);

CREATE TABLE "proposalRepairRequests" (
  "proposalId" string NOT NULL,
  "repairRequestId" string NOT NULL,
  PRIMARY KEY ("proposalId", "repairRequestId")
);

CREATE TABLE "replacementItems" (
  "id" string PRIMARY KEY,
  "proposalId" string NOT NULL,
  "oldComponentId" string,
  "newItemName" string NOT NULL,
  "newItemSpecs" text,
  "quantity" int NOT NULL DEFAULT 1,
  "reason" text,
  "newlyPurchasedComponentId" string
);

CREATE TABLE "software" (
  "id" string PRIMARY KEY,
  "name" string NOT NULL,
  "version" string,
  "publisher" string,
  "createdAt" timestamp
);

CREATE TABLE "assetSoftware" (
  "assetId" string NOT NULL,
  "softwareId" string NOT NULL,
  "installationDate" date,
  "notes" text
);

CREATE TABLE "computers" (
  "id" string PRIMARY KEY,
  "assetId" string UNIQUE NOT NULL,
  "roomId" string NOT NULL,
  "machineLabel" string NOT NULL,
  "notes" text
);

CREATE TABLE "computerComponents" (
  "id" string PRIMARY KEY,
  "computerAssetId" string NOT NULL,
  "componentType" "ComponentType" NOT NULL,
  "name" string NOT NULL,
  "componentSpecs" text,
  "serialNumber" string UNIQUE,
  "status" "ComponentStatus" NOT NULL DEFAULT 'INSTALLED',
  "installedAt" timestamp DEFAULT (now()),
  "removedAt" timestamp,
  "notes" text
);

CREATE TABLE "softwareProposals" (
  "id" string PRIMARY KEY,
  "proposalCode" string UNIQUE NOT NULL,
  "proposerId" string NOT NULL,
  "approverId" string,
  "roomId" string NOT NULL,
  "reason" text NOT NULL,
  "status" "SoftwareProposalStatus" NOT NULL DEFAULT 'CHỜ_DUYỆT',
  "createdAt" timestamp,
  "updatedAt" timestamp
);

CREATE TABLE "softwareProposalItems" (
  "id" string PRIMARY KEY,
  "proposalId" string NOT NULL,
  "softwareName" string NOT NULL,
  "version" string,
  "publisher" string,
  "quantity" int NOT NULL DEFAULT 1,
  "licenseType" string,
  "newlyAcquiredSoftwareId" string
);

CREATE UNIQUE INDEX ON "computers" ("roomId", "machineLabel");

COMMENT ON COLUMN "roles"."id" IS 'UUID';

COMMENT ON COLUMN "roles"."name" IS 'Vai trò';

COMMENT ON COLUMN "roles"."code" IS 'Mã vai trò';

COMMENT ON COLUMN "permissions"."id" IS 'UUID';

COMMENT ON COLUMN "permissions"."name" IS 'Quyền';

COMMENT ON COLUMN "permissions"."code" IS 'Mã quyền';

COMMENT ON COLUMN "users"."id" IS 'UUID';

COMMENT ON COLUMN "users"."username" IS 'Tài khoản: Mã nhân viên';

COMMENT ON COLUMN "users"."unitId" IS 'Đơn vị';

COMMENT ON COLUMN "rfidTags"."rfidId" IS 'E280F3362000F00005E66021';

COMMENT ON COLUMN "rfidTags"."assetId" IS 'Mã tài sản';

COMMENT ON COLUMN "rfidTags"."assignedDate" IS 'Ngày định danh và đưa vào tài sản';

COMMENT ON COLUMN "assetTransactions"."type" IS 'Transfer, Allocate, Move';

COMMENT ON COLUMN "units"."id" IS 'Mã đơn vị sử dụng';

COMMENT ON COLUMN "units"."name" IS 'Tên đơn vị sử dụng';

COMMENT ON COLUMN "units"."phone" IS 'Số điện thoại';

COMMENT ON COLUMN "units"."email" IS 'Email';

COMMENT ON COLUMN "units"."representativeId" IS 'Người đại diện';

COMMENT ON COLUMN "rooms"."id" IS 'Mã phòng';

COMMENT ON COLUMN "rooms"."building" IS 'Tòa';

COMMENT ON COLUMN "rooms"."floor" IS 'Tầng';

COMMENT ON COLUMN "rooms"."roomNumber" IS 'Số phòng / tên phòng';

COMMENT ON COLUMN "rooms"."unitId" IS 'Mã đơn vị sử dụng';

COMMENT ON COLUMN "assetBooks"."unitId" IS 'Đơn vị quản lý sổ';

COMMENT ON COLUMN "assetBooks"."year" IS 'Năm';

COMMENT ON COLUMN "assetBooks"."lockedAt" IS 'Khóa sổ khi kết thúc năm';

COMMENT ON COLUMN "assetBooks"."status" IS 'Open, Closed';

COMMENT ON COLUMN "assetBookItems"."assignedAt" IS 'Ngày được ghi nhận vào sổ';

COMMENT ON COLUMN "assetBookItems"."quantity" IS 'Số lượng thực tế trong sổ';

COMMENT ON COLUMN "fileUrls"."id" IS 'UUID';

COMMENT ON COLUMN "inventorySessions"."id" IS 'UUID';

COMMENT ON COLUMN "inventorySessions"."year" IS 'Năm';

COMMENT ON COLUMN "inventorySessions"."name" IS 'Tên kỳ kiểm kê, ví dụ: Kiểm kê cuối năm';

COMMENT ON COLUMN "inventorySessions"."period" IS 'Đợt';

COMMENT ON COLUMN "inventorySessions"."isGlobal" IS 'true: Một kỳ cho toàn bộ các đơn vị sử dụng, false: Một kì cho một đơn vị sử dụng';

COMMENT ON COLUMN "inventoryCommittees"."name" IS 'Tên ban, ví dụ: Ban kiểm kê tài sản năm 2024';

COMMENT ON COLUMN "inventorySubCommittees"."name" IS 'Tên tiểu ban, ví dụ: Tiểu ban 1 - Khối công nghệ';

COMMENT ON COLUMN "inventoryGroups"."name" IS 'Tên nhóm, ví dụ: Nhóm I - Khoa Cơ khí';

COMMENT ON COLUMN "inventoryGroupAssignments"."startDate" IS 'Ngày bắt đầu kiểm kê tại đơn vị';

COMMENT ON COLUMN "inventoryGroupAssignments"."endDate" IS 'Ngày kết thúc kiểm kê tại đơn vị';

COMMENT ON COLUMN "inventoryResults"."assignmentId" IS 'Phân công kiểm kê';

COMMENT ON COLUMN "inventoryResults"."systemQuantity" IS 'Số lượng trên hệ thống';

COMMENT ON COLUMN "inventoryResults"."countedQuantity" IS 'Số lượng thực tế kiểm kê';

COMMENT ON COLUMN "alerts"."id" IS 'UUID';

COMMENT ON COLUMN "alerts"."detectedAt" IS 'Thời gian phát hiện';

COMMENT ON COLUMN "alerts"."type" IS 'Di chuyển không hợp lệ';

COMMENT ON COLUMN "alertResolutions"."id" IS 'UUID';

COMMENT ON COLUMN "damageReports"."id" IS 'UUID';

COMMENT ON COLUMN "damageReports"."reporter" IS 'Tên người report';

COMMENT ON COLUMN "damageReports"."description" IS 'Mô tả';

COMMENT ON COLUMN "damageReports"."mediaUrl" IS 'Ảnh / Video minh chứng';

COMMENT ON COLUMN "LiquidationProposals"."id" IS 'UUID';

COMMENT ON COLUMN "LiquidationProposals"."proposerId" IS 'Người đề xuất';

COMMENT ON COLUMN "LiquidationProposals"."unitId" IS 'Đơn vị sử dụng';

COMMENT ON COLUMN "LiquidationProposals"."status" IS 'Trạng thái đề xuất';

COMMENT ON COLUMN "LiquidationProposalItems"."id" IS 'UUID';

COMMENT ON COLUMN "LiquidationProposalItems"."condition" IS 'Trạng thái tài sản hiện tại';

COMMENT ON COLUMN "technicianAssignments"."technicianId" IS 'ID của Kỹ thuật viên';

COMMENT ON COLUMN "technicianAssignments"."building" IS 'Tên tòa nhà được phân công';

COMMENT ON COLUMN "technicianAssignments"."floor" IS 'Tên tầng được phân công, null nếu quản lý cả tòa';

COMMENT ON COLUMN "assets"."id" IS 'UUID';

COMMENT ON COLUMN "assets"."ktCode" IS 'Mã kế toán: xx-yyyy/nn (e.g., 19-0205/00)';

COMMENT ON COLUMN "assets"."fixedCode" IS 'Mã tài sản cố định xxxx.yyyy';

COMMENT ON COLUMN "assets"."name" IS 'Tên tài sản';

COMMENT ON COLUMN "assets"."specs" IS 'Thông số kĩ thuật';

COMMENT ON COLUMN "assets"."entrydate" IS 'Ngày nhập';

COMMENT ON COLUMN "assets"."currentRoomId" IS 'Mã vị trí hiện tại';

COMMENT ON COLUMN "assets"."unit" IS 'Đơn vị tính';

COMMENT ON COLUMN "assets"."quantity" IS 'Số lượng: Với tài sản cố định = 1';

COMMENT ON COLUMN "assets"."origin" IS 'Xuất xứ';

COMMENT ON COLUMN "assets"."purchasePackage" IS 'Gói mua';

COMMENT ON COLUMN "assets"."type" IS 'Loại tài sản';

COMMENT ON COLUMN "assets"."isHandover" IS 'Flag bàn giao';

COMMENT ON COLUMN "assets"."isLocked" IS 'Khi đã sử dụng thì không cho cập nhật lại';

COMMENT ON COLUMN "assets"."categoryId" IS 'Danh mục - 4: máy tính, 3: thiết bị văn phòng, 5: máy in';

COMMENT ON COLUMN "assets"."createdBy" IS 'User who initiated the handover';

COMMENT ON COLUMN "errorTypes"."id" IS 'UUID';

COMMENT ON COLUMN "errorTypes"."name" IS 'Tên loại lỗi, vd: Lỗi phần mềm, Lỗi màn hình, Lỗi bàn phím';

COMMENT ON COLUMN "errorTypes"."description" IS 'Mô tả chi tiết về loại lỗi';

COMMENT ON COLUMN "repairRequests"."id" IS 'UUID';

COMMENT ON COLUMN "repairRequests"."requestCode" IS 'Mã yêu cầu tự tăng, vd: YCSC-2025-0001';

COMMENT ON COLUMN "repairRequests"."computerAssetId" IS 'Tài sản (máy tính) gặp sự cố';

COMMENT ON COLUMN "repairRequests"."reporterId" IS 'Người báo lỗi (Giảng viên hoặc KTV)';

COMMENT ON COLUMN "repairRequests"."assignedTechnicianId" IS 'KTV được phân công xử lý';

COMMENT ON COLUMN "repairRequests"."errorTypeId" IS 'Phân loại lỗi theo danh mục có sẵn';

COMMENT ON COLUMN "repairRequests"."description" IS 'Mô tả chi tiết tình trạng lỗi';

COMMENT ON COLUMN "repairRequests"."mediaUrls" IS 'Mảng các đường dẫn ảnh/video minh họa lỗi';

COMMENT ON COLUMN "repairRequests"."resolutionNotes" IS 'Ghi chú của KTV về kết quả xử lý (sửa được gì, thay thế ra sao)';

COMMENT ON COLUMN "repairRequests"."createdAt" IS 'Thời điểm báo lỗi';

COMMENT ON COLUMN "repairRequests"."acceptedAt" IS 'Thời điểm KTV tiếp nhận';

COMMENT ON COLUMN "repairRequests"."completedAt" IS 'Thời điểm hoàn tất xử lý';

COMMENT ON COLUMN "repairRequestComponents"."note" IS 'Ghi chú riêng cho tình trạng của linh kiện này nếu cần';

COMMENT ON COLUMN "repairLogs"."id" IS 'UUID';

COMMENT ON COLUMN "repairLogs"."actorId" IS 'Người thực hiện hành động';

COMMENT ON COLUMN "repairLogs"."action" IS 'Hành động đã thực hiện, vd: "Tạo yêu cầu", "Tiếp nhận xử lý", "Gửi đề xuất thay thế", "Hoàn tất"';

COMMENT ON COLUMN "repairLogs"."fromStatus" IS 'Trạng thái trước khi thay đổi';

COMMENT ON COLUMN "repairLogs"."toStatus" IS 'Trạng thái sau khi thay đổi';

COMMENT ON COLUMN "repairLogs"."comment" IS 'Ghi chú cho hành động này';

COMMENT ON COLUMN "replacementProposals"."id" IS 'UUID';

COMMENT ON COLUMN "replacementProposals"."title" IS 'Tiêu đề đề xuất';

COMMENT ON COLUMN "replacementProposals"."description" IS 'Mô tả đề xuất';

COMMENT ON COLUMN "replacementProposals"."proposalCode" IS 'Mã đề xuất, vd: DXTT-2025-0001';

COMMENT ON COLUMN "replacementProposals"."proposerId" IS 'Kỹ thuật viên lập đề xuất';

COMMENT ON COLUMN "replacementProposals"."teamLeadApproverId" IS 'Tổ trưởng kỹ thuật duyệt';

COMMENT ON COLUMN "replacementProposals"."adminVerifierId" IS 'Người của Phòng Quản trị đi xác minh';

COMMENT ON COLUMN "replacementProposals"."submissionFormUrl" IS 'Đường dẫn file Tờ trình';

COMMENT ON COLUMN "replacementProposals"."verificationReportUrl" IS 'Đường dẫn file Biên bản xác nhận tại hiện trường';

COMMENT ON COLUMN "replacementItems"."id" IS 'UUID';

COMMENT ON COLUMN "replacementItems"."oldComponentId" IS 'Linh kiện cũ bị hỏng cần thay';

COMMENT ON COLUMN "replacementItems"."newItemName" IS 'Tên linh kiện/thiết bị mới cần mua';

COMMENT ON COLUMN "replacementItems"."newItemSpecs" IS 'Thông số kỹ thuật chi tiết';

COMMENT ON COLUMN "replacementItems"."reason" IS 'Lý do cần thay thế';

COMMENT ON COLUMN "replacementItems"."newlyPurchasedComponentId" IS 'ID của tài sản mới sau khi được mua và sử dụng';

COMMENT ON COLUMN "software"."id" IS 'UUID';

COMMENT ON COLUMN "software"."name" IS 'Tên phần mềm, vd: Microsoft Office 2021, AutoCAD 2024';

COMMENT ON COLUMN "software"."version" IS 'Phiên bản phần mềm';

COMMENT ON COLUMN "software"."publisher" IS 'Nhà sản xuất';

COMMENT ON COLUMN "assetSoftware"."assetId" IS 'ID của máy tính';

COMMENT ON COLUMN "assetSoftware"."softwareId" IS 'ID của phần mềm';

COMMENT ON COLUMN "assetSoftware"."installationDate" IS 'Ngày cài đặt';

COMMENT ON COLUMN "assetSoftware"."notes" IS 'Ghi chú, ví dụ: key license';

COMMENT ON COLUMN "computers"."id" IS 'UUID';

COMMENT ON COLUMN "computers"."roomId" IS 'Vị trí của máy tính này';

COMMENT ON COLUMN "computers"."machineLabel" IS 'Số máy';

COMMENT ON COLUMN "computerComponents"."id" IS 'UUID - Đây là mã định danh duy nhất cho một linh kiện cụ thể';

COMMENT ON COLUMN "computerComponents"."computerAssetId" IS 'FK đến máy tính cha';

COMMENT ON COLUMN "computerComponents"."componentType" IS 'Loại linh kiện là gì (CPU, RAM, ...)';

COMMENT ON COLUMN "computerComponents"."name" IS 'Tên/Model của linh kiện, vd: Kingston Fury Beast DDR5';

COMMENT ON COLUMN "computerComponents"."componentSpecs" IS 'Thông số kỹ thuật chi tiết, vd: 16GB 5200MHz';

COMMENT ON COLUMN "computerComponents"."serialNumber" IS 'Số serial của linh kiện nếu có';

COMMENT ON COLUMN "computerComponents"."status" IS 'Trạng thái của linh kiện này';

COMMENT ON COLUMN "computerComponents"."installedAt" IS 'Ngày lắp đặt linh kiện này vào máy';

COMMENT ON COLUMN "computerComponents"."removedAt" IS 'Ngày gỡ ra (khi thay thế hoặc hỏng)';

COMMENT ON COLUMN "softwareProposals"."id" IS 'UUID';

COMMENT ON COLUMN "softwareProposals"."proposalCode" IS 'Mã đề xuất, vd: DXPM-2025-0001';

COMMENT ON COLUMN "softwareProposals"."proposerId" IS 'Người tạo đề xuất';

COMMENT ON COLUMN "softwareProposals"."approverId" IS 'Người duyệt đề xuất';

COMMENT ON COLUMN "softwareProposals"."roomId" IS 'Phòng máy cần trang bị phần mềm';

COMMENT ON COLUMN "softwareProposals"."reason" IS 'Lý do cần trang bị phần mềm';

COMMENT ON COLUMN "softwareProposalItems"."id" IS 'UUID';

COMMENT ON COLUMN "softwareProposalItems"."softwareName" IS 'Tên phần mềm cần mua';

COMMENT ON COLUMN "softwareProposalItems"."publisher" IS 'Nhà sản xuất';

COMMENT ON COLUMN "softwareProposalItems"."quantity" IS 'Số lượng license cần mua';

COMMENT ON COLUMN "softwareProposalItems"."licenseType" IS 'Loại giấy phép: Vĩnh viễn, Theo năm...';

COMMENT ON COLUMN "softwareProposalItems"."newlyAcquiredSoftwareId" IS 'ID trong bảng Software sau khi được thêm vào';

ALTER TABLE "roles_permissions" ADD FOREIGN KEY ("roleId") REFERENCES "roles" ("id");

ALTER TABLE "roles_permissions" ADD FOREIGN KEY ("permissionId") REFERENCES "permissions" ("id");

ALTER TABLE "users_roles" ADD FOREIGN KEY ("roleId") REFERENCES "roles" ("id");

ALTER TABLE "users_roles" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "rfidTags" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "assetTransactions" ADD FOREIGN KEY ("fromUnitId") REFERENCES "units" ("id");

ALTER TABLE "assetTransactions" ADD FOREIGN KEY ("toUnitId") REFERENCES "units" ("id");

ALTER TABLE "assetTransactions" ADD FOREIGN KEY ("fromRoomId") REFERENCES "rooms" ("id");

ALTER TABLE "assetTransactions" ADD FOREIGN KEY ("toRoomId") REFERENCES "rooms" ("id");

ALTER TABLE "assetTransactions" ADD FOREIGN KEY ("createdBy") REFERENCES "users" ("id");

ALTER TABLE "assetTransactions" ADD FOREIGN KEY ("approvedBy") REFERENCES "users" ("id");

ALTER TABLE "assetTransactionItems" ADD FOREIGN KEY ("transactionId") REFERENCES "assetTransactions" ("id");

ALTER TABLE "assetTransactionItems" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "units" ADD FOREIGN KEY ("representativeId") REFERENCES "users" ("id");

ALTER TABLE "units" ADD FOREIGN KEY ("createdBy") REFERENCES "users" ("id");

ALTER TABLE "rooms" ADD FOREIGN KEY ("unitId") REFERENCES "units" ("id");

ALTER TABLE "categories" ADD FOREIGN KEY ("parentId") REFERENCES "categories" ("id");

ALTER TABLE "assetBooks" ADD FOREIGN KEY ("unitId") REFERENCES "units" ("id");

ALTER TABLE "assetBooks" ADD FOREIGN KEY ("createdBy") REFERENCES "users" ("id");

ALTER TABLE "assetBookItems" ADD FOREIGN KEY ("bookId") REFERENCES "assetBooks" ("id");

ALTER TABLE "assetBookItems" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "assetBookItems" ADD FOREIGN KEY ("roomId") REFERENCES "rooms" ("id");

ALTER TABLE "inventorySessions" ADD FOREIGN KEY ("createdBy") REFERENCES "users" ("id");

ALTER TABLE "fileUrls_inventorySessions" ADD FOREIGN KEY ("inventorySessionId") REFERENCES "inventorySessions" ("id");

ALTER TABLE "fileUrls_inventorySessions" ADD FOREIGN KEY ("fileUrlId") REFERENCES "fileUrls" ("id");

ALTER TABLE "inventorySessionUnits" ADD FOREIGN KEY ("sessionId") REFERENCES "inventorySessions" ("id");

ALTER TABLE "inventorySessionUnits" ADD FOREIGN KEY ("unitId") REFERENCES "units" ("id");

ALTER TABLE "inventoryCommittees" ADD FOREIGN KEY ("sessionId") REFERENCES "inventorySessions" ("id");

ALTER TABLE "inventoryCommitteeMembers" ADD FOREIGN KEY ("committeeId") REFERENCES "inventoryCommittees" ("id");

ALTER TABLE "inventoryCommitteeMembers" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "inventorySubCommittees" ADD FOREIGN KEY ("committeeId") REFERENCES "inventoryCommittees" ("id");

ALTER TABLE "inventorySubCommittees" ADD FOREIGN KEY ("leaderId") REFERENCES "users" ("id");

ALTER TABLE "inventorySubCommittees" ADD FOREIGN KEY ("secretaryId") REFERENCES "users" ("id");

ALTER TABLE "inventoryGroups" ADD FOREIGN KEY ("subCommitteeId") REFERENCES "inventorySubCommittees" ("id");

ALTER TABLE "inventoryGroups" ADD FOREIGN KEY ("leaderId") REFERENCES "users" ("id");

ALTER TABLE "inventoryGroups" ADD FOREIGN KEY ("secretaryId") REFERENCES "users" ("id");

ALTER TABLE "inventoryGroupMembers" ADD FOREIGN KEY ("groupId") REFERENCES "inventoryGroups" ("id");

ALTER TABLE "inventoryGroupMembers" ADD FOREIGN KEY ("userId") REFERENCES "users" ("id");

ALTER TABLE "inventoryGroupAssignments" ADD FOREIGN KEY ("groupId") REFERENCES "inventoryGroups" ("id");

ALTER TABLE "inventoryGroupAssignments" ADD FOREIGN KEY ("unitId") REFERENCES "units" ("id");

ALTER TABLE "inventoryResults" ADD FOREIGN KEY ("assignmentId") REFERENCES "inventoryGroupAssignments" ("id");

ALTER TABLE "inventoryResults" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "alerts" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "alerts" ADD FOREIGN KEY ("roomId") REFERENCES "rooms" ("id");

ALTER TABLE "alertResolutions" ADD FOREIGN KEY ("alertId") REFERENCES "alerts" ("id");

ALTER TABLE "alertResolutions" ADD FOREIGN KEY ("resolverId") REFERENCES "users" ("id");

ALTER TABLE "damageReports" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "damageReports" ADD FOREIGN KEY ("roomId") REFERENCES "rooms" ("id");

ALTER TABLE "LiquidationProposals" ADD FOREIGN KEY ("proposerId") REFERENCES "users" ("id");

ALTER TABLE "LiquidationProposals" ADD FOREIGN KEY ("unitId") REFERENCES "units" ("id");

ALTER TABLE "LiquidationProposalItems" ADD FOREIGN KEY ("proposalId") REFERENCES "LiquidationProposals" ("id");

ALTER TABLE "LiquidationProposalItems" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "technicianAssignments" ADD FOREIGN KEY ("technicianId") REFERENCES "users" ("id");

ALTER TABLE "assets" ADD FOREIGN KEY ("currentRoomId") REFERENCES "rooms" ("id");

ALTER TABLE "assets" ADD FOREIGN KEY ("categoryId") REFERENCES "categories" ("id");

ALTER TABLE "assets" ADD FOREIGN KEY ("createdBy") REFERENCES "users" ("id");

ALTER TABLE "repairRequests" ADD FOREIGN KEY ("computerAssetId") REFERENCES "assets" ("id");

ALTER TABLE "repairRequests" ADD FOREIGN KEY ("reporterId") REFERENCES "users" ("id");

ALTER TABLE "repairRequests" ADD FOREIGN KEY ("assignedTechnicianId") REFERENCES "users" ("id");

ALTER TABLE "repairRequests" ADD FOREIGN KEY ("errorTypeId") REFERENCES "errorTypes" ("id");

ALTER TABLE "repairRequestComponents" ADD FOREIGN KEY ("repairRequestId") REFERENCES "repairRequests" ("id");

ALTER TABLE "repairRequestComponents" ADD FOREIGN KEY ("componentId") REFERENCES "computerComponents" ("id");

ALTER TABLE "repairLogs" ADD FOREIGN KEY ("repairRequestId") REFERENCES "repairRequests" ("id");

ALTER TABLE "repairLogs" ADD FOREIGN KEY ("actorId") REFERENCES "users" ("id");

ALTER TABLE "replacementProposals" ADD FOREIGN KEY ("proposerId") REFERENCES "users" ("id");

ALTER TABLE "replacementProposals" ADD FOREIGN KEY ("teamLeadApproverId") REFERENCES "users" ("id");

ALTER TABLE "replacementProposals" ADD FOREIGN KEY ("adminVerifierId") REFERENCES "users" ("id");

ALTER TABLE "proposalRepairRequests" ADD FOREIGN KEY ("proposalId") REFERENCES "replacementProposals" ("id");

ALTER TABLE "proposalRepairRequests" ADD FOREIGN KEY ("repairRequestId") REFERENCES "repairRequests" ("id");

ALTER TABLE "replacementItems" ADD FOREIGN KEY ("proposalId") REFERENCES "replacementProposals" ("id");

ALTER TABLE "replacementItems" ADD FOREIGN KEY ("oldComponentId") REFERENCES "computerComponents" ("id");

ALTER TABLE "replacementItems" ADD FOREIGN KEY ("newlyPurchasedComponentId") REFERENCES "computerComponents" ("id");

ALTER TABLE "assetSoftware" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "assetSoftware" ADD FOREIGN KEY ("softwareId") REFERENCES "software" ("id");

ALTER TABLE "computers" ADD FOREIGN KEY ("assetId") REFERENCES "assets" ("id");

ALTER TABLE "computers" ADD FOREIGN KEY ("roomId") REFERENCES "rooms" ("id");

ALTER TABLE "computerComponents" ADD FOREIGN KEY ("computerAssetId") REFERENCES "assets" ("id");

ALTER TABLE "softwareProposals" ADD FOREIGN KEY ("proposerId") REFERENCES "users" ("id");

ALTER TABLE "softwareProposals" ADD FOREIGN KEY ("approverId") REFERENCES "users" ("id");

ALTER TABLE "softwareProposals" ADD FOREIGN KEY ("roomId") REFERENCES "rooms" ("id");

ALTER TABLE "softwareProposalItems" ADD FOREIGN KEY ("proposalId") REFERENCES "softwareProposals" ("id");

ALTER TABLE "softwareProposalItems" ADD FOREIGN KEY ("newlyAcquiredSoftwareId") REFERENCES "software" ("id");
