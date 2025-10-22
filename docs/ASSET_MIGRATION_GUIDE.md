# 🔄 Asset Migration Service - Tách dữ liệu từ Assets sang Computer & Components

## 📋 Tổng quan

Service này dùng để migrate dữ liệu từ bảng **`assets`** (chứa thông tin tổng quát) sang 2 bảng chi tiết:
- **`computers`** - Thông tin máy tính và vị trí
- **`computer_components`** - Các linh kiện cấu thành máy tính

## 🎯 Mục đích

### Trước khi migrate:
```
assets
├── id: uuid
├── ktCode: "1"
├── name: "Máy vi tính Vostro 270MT"
└── specs: "Máy tính để bàn Dell Vostro 270MT - Intel Pentium G2020, 2GB RAM, 500GB HDD, VGA Intel HD Graphics, DVDRW, Keyboard + Mouse"
```

### Sau khi migrate:

```
computers
├── id: uuid
├── assetId: uuid (FK to assets)
├── roomId: uuid
├── machineLabel: "PC-C196-001"
└── notes: "Migrated from asset: Máy vi tính Vostro 270MT"

computer_components (7 components)
├── CPU
│   └── name: "Intel Pentium G2020"
├── RAM
│   └── name: "RAM 2GB", specs: "2GB"
├── STORAGE
│   └── name: "500GB HDD", specs: "500GB HDD"
├── GPU
│   └── name: "VGA Intel HD Graphics"
├── OPTICAL_DRIVE
│   └── name: "DVDRW"
├── KEYBOARD
│   └── name: "Keyboard"
└── MOUSE
    └── name: "Mouse"
```

## 🔧 Tính năng chính

### 1. **Parse Specs thông minh**

Service tự động phân tích chuỗi `specs` và trích xuất thông tin:

| Component Type | Pattern nhận diện | Ví dụ |
|---------------|-------------------|-------|
| **CPU** | Intel/AMD/Pentium/Celeron + model | `Intel Pentium G2020` |
| **RAM** | Số + GB RAM | `2GB RAM` |
| **STORAGE** | Số + GB/TB + HDD/SSD | `500GB HDD`, `1TB SSD` |
| **GPU** | VGA/NVIDIA/AMD Radeon/Intel Graphics | `VGA Intel HD Graphics` |
| **MONITOR** | Từ khóa "monitor"/"màn hình" | `Monitor Dell 24"` |
| **KEYBOARD** | Từ khóa "keyboard"/"bàn phím" | `Keyboard` |
| **MOUSE** | Từ khóa "mouse"/"chuột" | `Mouse` |
| **OPTICAL_DRIVE** | DVDRW/CD-ROM | `DVDRW` |

### 2. **Machine Label tự động**

Tự động tạo mã máy theo format: `PC-{RoomID_Suffix}-{Index}`

**Ví dụ:**
- Room ID: `87ccafb9-9a2d-491a-9b54-7281a2c196cc`
- Machine 1: `PC-C196-001`
- Machine 2: `PC-C196-002`
- Machine 3: `PC-C196-003`

### 3. **Group theo Room**

- Tự động nhóm assets theo phòng
- Đánh số thứ tự máy trong từng phòng
- Skip assets không có room

### 4. **Idempotent (An toàn chạy lại)**

- Kiểm tra trùng lặp trước khi tạo
- Không tạo lại computer đã tồn tại
- Log rõ ràng các trường hợp skip

## 📦 Cài đặt

### 1. Add vào AssetsModule

```typescript
// src/modules/assets/assets.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Asset } from 'src/entities/asset.entity';
import { Computer } from 'src/entities/computer.entity';
import { ComputerComponent } from 'src/entities/computer-component.entity';
import { AssetsMigrationService } from './assets-migration.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Asset,
      Computer,
      ComputerComponent,
    ]),
  ],
  providers: [AssetsMigrationService],
  exports: [AssetsMigrationService],
})
export class AssetsModule {}
```

### 2. Tạo Migration Controller (Optional - để test)

```typescript
// src/modules/assets/migration.controller.ts
import { Controller, Post, Delete, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AssetsMigrationService } from './assets-migration.service';

@ApiTags('Migration')
@Controller('migration')
export class MigrationController {
  constructor(
    private readonly migrationService: AssetsMigrationService,
  ) {}

  @Post('assets-to-computers')
  @ApiOperation({ summary: 'Migrate tất cả assets sang computers' })
  async migrateAll(@Body() body: { categoryIds?: string[] }) {
    return this.migrationService.migrateAllComputerAssets(body.categoryIds);
  }

  @Delete('rollback-migration')
  @ApiOperation({ summary: '⚠️ Rollback - Xóa tất cả dữ liệu migrate' })
  async rollback() {
    return this.migrationService.rollbackMigration();
  }
}
```

## 🚀 Sử dụng

### Option 1: Via API (với Migration Controller)

```bash
# Migrate tất cả assets là máy tính
POST http://localhost:3001/api/v1/migration/assets-to-computers
Content-Type: application/json

{}

# Hoặc filter theo category
POST http://localhost:3001/api/v1/migration/assets-to-computers
Content-Type: application/json

{
  "categoryIds": ["df3ccfa4-a6c7-47ea-81a3-69aeba7494ef"]
}

# Rollback (xóa tất cả)
DELETE http://localhost:3001/api/v1/migration/rollback-migration
```

### Option 2: Via Service (trong code)

```typescript
import { Injectable } from '@nestjs/common';
import { AssetsMigrationService } from '../assets/assets-migration.service';

@Injectable()
export class SomeService {
  constructor(
    private readonly migrationService: AssetsMigrationService,
  ) {}

  async runMigration() {
    // Migrate tất cả
    const result = await this.migrationService.migrateAllComputerAssets();
    console.log('Migration result:', result);

    // Hoặc migrate theo category
    const result2 = await this.migrationService.migrateAllComputerAssets([
      'category-id-1',
      'category-id-2',
    ]);

    // Rollback
    await this.migrationService.rollbackMigration();
  }

  async migrateSingleAsset(asset: Asset) {
    // Migrate 1 asset cụ thể
    const computer = await this.migrationService.migrateAssetToComputer(
      asset,
      1, // Machine index
    );
  }
}
```

### Option 3: Via Script/CLI

```typescript
// scripts/migrate-assets.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AssetsMigrationService } from '../src/modules/assets/assets-migration.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const migrationService = app.get(AssetsMigrationService);

  console.log('🚀 Bắt đầu migration...');
  const result = await migrationService.migrateAllComputerAssets();

  console.log('\n📊 Kết quả:');
  console.log(JSON.stringify(result, null, 2));

  await app.close();
}

bootstrap();
```

Chạy:
```bash
ts-node scripts/migrate-assets.ts
```

## 📊 Output mẫu

```bash
🚀 Bắt đầu migrate assets sang computers...
📊 Tìm thấy 50 assets cần migrate

📍 Processing room c196cc - 10 assets
✅ Tạo Computer thành công cho asset 1 - Machine: PC-C196-001
✅ Tạo 7 components cho computer PC-C196-001
✅ Tạo Computer thành công cho asset 2 - Machine: PC-C196-002
✅ Tạo 7 components cho computer PC-C196-002
...

📍 Processing room a2d4 - 15 assets
✅ Tạo Computer thành công cho asset 11 - Machine: PC-A2D4-001
⚠️  Không parse được component nào từ specs của asset 12
...

============================================================
🎉 Migration hoàn tất!
📊 Tổng số: 50
✅ Thành công: 48
⏭️  Bỏ qua: 2
❌ Thất bại: 0
============================================================
```

## 🔍 Kiểm tra kết quả

### 1. Kiểm tra Computers đã tạo

```sql
SELECT 
    c.id,
    c."machineLabel",
    c."roomId",
    a."ktCode",
    a.name,
    r.name as room_name
FROM computers c
JOIN assets a ON c."assetId" = a.id
JOIN rooms r ON c."roomId" = r.id
ORDER BY c."machineLabel";
```

### 2. Kiểm tra Components

```sql
SELECT 
    cc."componentType",
    cc.name,
    cc."componentSpecs",
    c."machineLabel",
    a."ktCode"
FROM computer_components cc
JOIN computers c ON cc."computerAssetId" = c."assetId"
JOIN assets a ON c."assetId" = a.id
ORDER BY c."machineLabel", cc."componentType";
```

### 3. Thống kê

```sql
-- Số computer đã tạo
SELECT COUNT(*) as total_computers FROM computers;

-- Số components theo loại
SELECT 
    "componentType",
    COUNT(*) as count
FROM computer_components
GROUP BY "componentType"
ORDER BY count DESC;

-- Assets chưa migrate (không có computer)
SELECT 
    a."ktCode",
    a.name,
    a."currentRoomId"
FROM assets a
LEFT JOIN computers c ON a.id = c."assetId"
WHERE c.id IS NULL
    AND (LOWER(a.name) LIKE '%máy tính%' OR LOWER(a.name) LIKE '%computer%');
```

## ⚠️ Lưu ý quan trọng

### 1. **Backup trước khi chạy**

```bash
# Backup database
pg_dump -h localhost -U postgres -d repair_asset_db > backup.sql
```

### 2. **Test trên môi trường development trước**

```bash
# Chạy migration
POST /api/v1/migration/assets-to-computers

# Kiểm tra kết quả
# Nếu không OK:
DELETE /api/v1/migration/rollback-migration

# Restore từ backup
psql -h localhost -U postgres -d repair_asset_db < backup.sql
```

### 3. **Parse specs có thể không hoàn hảo**

Service parse dựa trên regex patterns. Một số specs phức tạp có thể không parse được hết:

**Specs khó parse:**
```
"Bộ máy vi tính trong 1 (case ko màu đen, Mainboard H310M PRO-M2 PLUS (MS-7B53), CPU Intel Pentium Gold G6400 @ 4.00GHz, Ram DDR4-2666 8GB)"
```

**Solution:**
- Kiểm tra log để xem assets nào parse không đầy đủ
- Thêm pattern mới vào method `parseSpecs()` nếu cần
- Hoặc thêm components thủ công sau khi migrate

### 4. **Room ID bắt buộc**

Assets không có `currentRoomId` sẽ bị skip. Cần:
- Gán room cho asset trước khi migrate
- Hoặc tạo default room "Chưa phân bổ"

## 🛠️ Mở rộng

### 1. Thêm pattern parse mới

```typescript
// Trong parseSpecs()

// Parse SSD NVMe
const nvmePattern = /(\d+)\s*gb\s+nvme/i;
const nvmeMatch = specs.match(nvmePattern);
if (nvmeMatch) {
  components.push({
    componentType: ComponentType.STORAGE,
    name: `${nvmeMatch[1]}GB NVMe SSD`,
    componentSpecs: nvmeMatch[0],
  });
}
```

### 2. Custom machine label format

```typescript
// Thay đổi generateMachineLabel()
private generateMachineLabel(roomId: string, index: number): string {
  // Format mới: Room_Name-Index
  return `PHONG_${roomId.slice(0, 4)}-MAY_${index}`;
}
```

### 3. Thêm validation

```typescript
async migrateAssetToComputer(asset: Asset, machineIndex: number) {
  // Validate asset type
  if (asset.type !== AssetType.FIXED_ASSET) {
    this.logger.warn(`Asset ${asset.ktCode} không phải FIXED_ASSET`);
    return null;
  }

  // Validate category
  const computerCategory = await this.categoryRepository.findOne({
    where: { name: 'Máy tính' },
  });
  
  if (asset.categoryId !== computerCategory.id) {
    return null;
  }

  // ... rest of migration
}
```

## 📚 Tham khảo

- **Entities**: `src/entities/asset.entity.ts`, `computer.entity.ts`, `computer-component.entity.ts`
- **Enums**: `src/common/shared/ComponentType.ts`, `ComponentStatus.ts`
- **Migration Service**: `src/modules/assets/assets-migration.service.ts`

## 🆘 Troubleshooting

### Lỗi: "Computer đã tồn tại"
- Migration đã chạy trước đó
- Rollback và chạy lại, hoặc bỏ qua

### Lỗi: "Asset không có room_id"
- Gán room cho asset trước khi migrate
- Hoặc tạo default room

### Parse không đủ components
- Kiểm tra log: "⚠️ Không parse được component"
- Thêm pattern mới hoặc thêm components thủ công
- Chạy UPDATE SQL để thêm components thiếu

### Performance chậm
- Migrate theo batch nhỏ (filter theo categoryIds)
- Thêm index cho các foreign key
- Chạy ngoài giờ cao điểm

---

**Tác giả**: Asset Migration Service
**Version**: 1.0.0
**Ngày tạo**: 20/10/2025
