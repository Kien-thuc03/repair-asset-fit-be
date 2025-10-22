# 🎯 Asset Migration Service - Quick Start

## Chức năng
Tách dữ liệu từ bảng `assets` (chứa thông tin tổng quát) sang:
- `computers` - Thông tin máy tính và vị trí
- `computer_components` - Các linh kiện cấu thành máy

## 📦 Files đã tạo

```
src/modules/assets/
└── assets-migration.service.ts    # Service chính

scripts/
└── migrate-assets.ts               # CLI script

docs/
└── ASSET_MIGRATION_GUIDE.md        # Hướng dẫn chi tiết
```

## 🚀 Cách sử dụng

### 1. Migrate tất cả assets là máy tính

```bash
npm run migrate:assets
```

### 2. Migrate theo category cụ thể

```bash
npm run migrate:assets -- --category "df3ccfa4-a6c7-47ea-81a3-69aeba7494ef"
```

### 3. Rollback (xóa tất cả dữ liệu đã migrate)

```bash
npm run migrate:assets -- --rollback
```

## 📊 Output mẫu

```
╔════════════════════════════════════════════════════════════╗
║     ASSET MIGRATION CLI - Computer & Components           ║
╚════════════════════════════════════════════════════════════╝

🚀 MODE: MIGRATION
📂 Filter: Tất cả assets là máy tính

🚀 Bắt đầu migrate assets sang computers...
📊 Tìm thấy 50 assets cần migrate

📍 Processing room c196cc - 10 assets
✅ Tạo Computer thành công cho asset 1 - Machine: PC-C196-001
✅ Tạo 7 components cho computer PC-C196-001
✅ Tạo Computer thành công cho asset 2 - Machine: PC-C196-002
...

╔════════════════════════════════════════════════════════╗
║                  MIGRATION SUMMARY                     ║
╚════════════════════════════════════════════════════════╝
📊 Tổng số assets:    50
✅ Migrate thành công: 48
⏭️  Bỏ qua:            2
❌ Thất bại:           0
```

## 🔍 Kiểm tra kết quả

```sql
-- Xem computers đã tạo
SELECT * FROM computers LIMIT 10;

-- Xem components đã tạo
SELECT * FROM computer_components LIMIT 10;

-- Thống kê
SELECT "componentType", COUNT(*) 
FROM computer_components 
GROUP BY "componentType";
```

## 📚 Xem thêm

Chi tiết đầy đủ: [ASSET_MIGRATION_GUIDE.md](./ASSET_MIGRATION_GUIDE.md)

## ⚠️ Lưu ý

1. **Backup database trước khi chạy**
2. **Test trên development trước**
3. Assets phải có `currentRoomId` mới migrate được
4. Parse specs dựa trên regex - có thể không hoàn hảo 100%
5. Chạy lại script là an toàn (idempotent) - sẽ skip dữ liệu đã tồn tại
