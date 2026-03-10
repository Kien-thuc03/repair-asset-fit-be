-- ============================================================
-- SQL QUERIES - Kiểm tra kết quả Asset Migration
-- ============================================================
-- 
-- ⚠️  QUAN TRỌNG - FOREIGN KEY REFERENCE:
-- 
--     computer_components.computerAssetId → computers.id (KHÔNG phải computers.assetId!)
-- 
--     ❌ SAI:  cc."computerAssetId" = c."assetId"
--     ✅ ĐÚNG: cc."computerAssetId" = c.id
-- 
--     Lý do: 
--     - computers.id = Computer ID (Primary Key)
--     - computers.assetId = Asset ID (Foreign Key tới assets.id)
--     - computerAssetId tham chiếu đến COMPUTER ID, không phải ASSET ID
-- 
-- ============================================================

-- 1. ĐẾM SỐ LƯỢNG
-- ============================================================

-- Tổng số computers đã tạo
SELECT COUNT(*) as total_computers FROM computers;

-- Tổng số components đã tạo
SELECT COUNT(*) as total_components FROM computer_components;

-- Số components theo loại
SELECT 
    "componentType",
    COUNT(*) as count
FROM computer_components
GROUP BY "componentType"
ORDER BY count DESC;


-- 2. XEM DỮ LIỆU ĐÃ MIGRATE
-- ============================================================

-- Xem computers với thông tin asset
SELECT 
    c.id,
    c."machineLabel",
    c."roomId",
    c.notes,
    a."ktCode",
    a.name as asset_name,
    a.specs,
    r.name as room_name
FROM computers c
JOIN assets a ON c."assetId" = a.id
LEFT JOIN rooms r ON c."roomId" = r.id
ORDER BY c."machineLabel"
LIMIT 20;

-- Xem components của một computer cụ thể
SELECT 
    cc."componentType",
    cc.name,
    cc."componentSpecs",
    cc.status,
    cc."installedAt"
FROM computer_components cc
WHERE cc."computerAssetId" = (
    SELECT id FROM computers LIMIT 1
)
ORDER BY cc."componentType";

-- Xem tất cả components với thông tin computer
SELECT 
    c."machineLabel",
    a."ktCode",
    cc."componentType",
    cc.name,
    cc."componentSpecs",
    cc.status
FROM computer_components cc
JOIN computers c ON cc."computerAssetId" = c.id
JOIN assets a ON c."assetId" = a.id
ORDER BY c."machineLabel", cc."componentType"
LIMIT 50;


-- 3. THỐNG KÊ CHI TIẾT
-- ============================================================

-- Số components trên mỗi computer
SELECT 
    c."machineLabel",
    a."ktCode",
    COUNT(cc.id) as num_components
FROM computers c
JOIN assets a ON c."assetId" = a.id
LEFT JOIN computer_components cc ON cc."computerAssetId" = c.id
GROUP BY c.id, c."machineLabel", a."ktCode"
ORDER BY num_components DESC;

-- Computers theo room
SELECT 
    r.name as room_name,
    r.id as room_id,
    COUNT(c.id) as num_computers
FROM rooms r
LEFT JOIN computers c ON c."roomId" = r.id
GROUP BY r.id, r.name
HAVING COUNT(c.id) > 0
ORDER BY num_computers DESC;

-- Component types thống kê
SELECT 
    "componentType",
    COUNT(*) as total_count,
    COUNT(DISTINCT "computerAssetId") as unique_computers,
    ROUND(COUNT(*)::numeric / COUNT(DISTINCT "computerAssetId"), 2) as avg_per_computer
FROM computer_components
GROUP BY "componentType"
ORDER BY total_count DESC;


-- 4. KIỂM TRA DỮ LIỆU BẤT THƯỜNG
-- ============================================================

-- Computers không có components
SELECT 
    c."machineLabel",
    a."ktCode",
    a.name,
    a.specs
FROM computers c
JOIN assets a ON c."assetId" = a.id
LEFT JOIN computer_components cc ON cc."computerAssetId" = c.id
WHERE cc.id IS NULL;

-- Assets là máy tính nhưng chưa migrate
SELECT 
    a."ktCode",
    a.name,
    a.specs,
    a."currentRoomId"
FROM assets a
LEFT JOIN computers c ON a.id = c."assetId"
WHERE c.id IS NULL
    AND (LOWER(a.name) LIKE '%máy tính%' OR LOWER(a.name) LIKE '%computer%')
ORDER BY a."ktCode";

-- Computers có quá ít components (<3)
SELECT 
    c."machineLabel",
    a."ktCode",
    COUNT(cc.id) as num_components
FROM computers c
JOIN assets a ON c."assetId" = a.id
LEFT JOIN computer_components cc ON cc."computerAssetId" = c.id
GROUP BY c.id, c."machineLabel", a."ktCode"
HAVING COUNT(cc.id) < 3
ORDER BY num_components ASC;

-- Components có specs NULL hoặc rỗng
SELECT 
    c."machineLabel",
    cc."componentType",
    cc.name,
    cc."componentSpecs"
FROM computer_components cc
JOIN computers c ON cc."computerAssetId" = c.id
WHERE cc."componentSpecs" IS NULL OR TRIM(cc."componentSpecs") = ''
ORDER BY c."machineLabel", cc."componentType";


-- 5. SO SÁNH TRƯỚC/SAU MIGRATE
-- ============================================================

-- Assets có computer vs không có
SELECT 
    CASE 
        WHEN c.id IS NOT NULL THEN 'Đã migrate'
        ELSE 'Chưa migrate'
    END as status,
    COUNT(a.id) as count
FROM assets a
LEFT JOIN computers c ON a.id = c."assetId"
WHERE (LOWER(a.name) LIKE '%máy tính%' OR LOWER(a.name) LIKE '%computer%')
GROUP BY CASE WHEN c.id IS NOT NULL THEN 'Đã migrate' ELSE 'Chưa migrate' END;

-- Top 10 computers có nhiều components nhất
SELECT 
    c."machineLabel",
    a."ktCode",
    a.name,
    COUNT(cc.id) as num_components,
    STRING_AGG(DISTINCT cc."componentType"::text, ', ' ORDER BY cc."componentType"::text) as component_types
FROM computers c
JOIN assets a ON c."assetId" = a.id
LEFT JOIN computer_components cc ON cc."computerAssetId" = c.id
GROUP BY c.id, c."machineLabel", a."ktCode", a.name
ORDER BY num_components DESC
LIMIT 10;


-- 6. XÓA DỮ LIỆU (ROLLBACK MANUAL)
-- ============================================================
-- ⚠️ CHÚ Ý: Chỉ dùng khi cần rollback thủ công

-- Xem số lượng trước khi xóa
-- SELECT COUNT(*) FROM computer_components;
-- SELECT COUNT(*) FROM computers;

-- Xóa components trước (vì có FK)
-- DELETE FROM computer_components;

-- Xóa computers
-- DELETE FROM computers;

-- Verify đã xóa
-- SELECT COUNT(*) FROM computer_components;
-- SELECT COUNT(*) FROM computers;


-- 7. CẬP NHẬT/FIX DỮ LIỆU
-- ============================================================

-- Thêm component thiếu cho một computer cụ thể
-- INSERT INTO computer_components ("computerAssetId", "componentType", name, "componentSpecs", status, "installedAt")
-- SELECT 
--     c.id,  -- ✅ ĐÚNG: Dùng computers.id không phải assetId
--     'MONITOR' as "componentType",
--     'Monitor Dell 24"' as name,
--     '24 inch Full HD' as "componentSpecs",
--     'INSTALLED' as status,
--     NOW() as "installedAt"
-- FROM computers c
-- WHERE c."machineLabel" = 'PC-C196-001';

-- Cập nhật machine label format
-- UPDATE computers 
-- SET "machineLabel" = 'NEW-' || "machineLabel"
-- WHERE "machineLabel" LIKE 'PC-%';

-- Cập nhật component specs
-- UPDATE computer_components
-- SET "componentSpecs" = CONCAT(name, ' - Updated')
-- WHERE "componentSpecs" IS NULL;


-- 8. EXPORT DỮ LIỆU
-- ============================================================

-- Export computers sang CSV (dùng psql)
-- \copy (SELECT c."machineLabel", a."ktCode", a.name, r.name as room FROM computers c JOIN assets a ON c."assetId" = a.id JOIN rooms r ON c."roomId" = r.id) TO 'computers.csv' WITH CSV HEADER;

-- Export components sang CSV
-- \copy (SELECT c."machineLabel", cc."componentType", cc.name, cc."componentSpecs" FROM computer_components cc JOIN computers c ON cc."computerAssetId" = c.id) TO 'components.csv' WITH CSV HEADER;


-- 9. PERFORMANCE QUERIES
-- ============================================================

-- Index suggestions (nếu query chậm)
-- CREATE INDEX IF NOT EXISTS idx_computers_asset_id ON computers("assetId");
-- CREATE INDEX IF NOT EXISTS idx_computers_room_id ON computers("roomId");
-- CREATE INDEX IF NOT EXISTS idx_components_computer_asset_id ON computer_components("computerAssetId");
-- CREATE INDEX IF NOT EXISTS idx_components_type ON computer_components("componentType");

-- Analyze query performance
-- EXPLAIN ANALYZE
-- SELECT ...


-- 10. VALIDATION CHECKS
-- ============================================================

-- Kiểm tra data integrity
SELECT 
    'Computers with invalid assetId' as check_name,
    COUNT(*) as count
FROM computers c
LEFT JOIN assets a ON c."assetId" = a.id
WHERE a.id IS NULL

UNION ALL

SELECT 
    'Computers with invalid roomId' as check_name,
    COUNT(*) as count
FROM computers c
LEFT JOIN rooms r ON c."roomId" = r.id
WHERE r.id IS NULL

UNION ALL

SELECT 
    'Components with invalid computerAssetId' as check_name,
    COUNT(*) as count
FROM computer_components cc
LEFT JOIN computers c ON cc."computerAssetId" = c.id
WHERE c.id IS NULL

UNION ALL

SELECT 
    'Duplicate machine labels' as check_name,
    COUNT(*) - COUNT(DISTINCT "machineLabel") as count
FROM computers;
