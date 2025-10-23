# 🖥️ Computer API Documentation

## Tổng Quan

Module Computer cung cấp các API để quản lý máy tính và các linh kiện (components) của chúng trong hệ thống.

## Endpoints

### 1. Lấy Danh Sách Máy Tính Theo Phòng

**Endpoint:** `GET /computer/room/:roomId`

**Mô tả:** Lấy tất cả máy tính trong một phòng cụ thể, bao gồm thông tin chi tiết về asset, room và tất cả các components.

#### Request

**URL Parameters:**
- `roomId` (string, required): UUID của phòng cần tìm

**Example:**
```
GET /computer/room/87ccafb9-9a2d-491a-9b54-7281a2c196cc
```

#### Response

**Success Response (200 OK):**

```json
{
  "success": true,
  "message": "Tìm thấy 35 máy tính trong phòng",
  "data": {
    "roomId": "87ccafb9-9a2d-491a-9b54-7281a2c196cc",
    "totalComputers": 35,
    "computers": [
      {
        "id": "81956b53-f75c-4df4-9583-adcfb7dc9137",
        "machineLabel": "PC-96CC-001",
        "notes": "Migrated from asset: Máy vi tính Vostro 270MT",
        "asset": {
          "id": "48b11d82-dee9-4003-b34d-d6063cbb230a",
          "name": "Máy vi tính Vostro 270MT",
          "ktCode": "19-0205/00",
          "fixedCode": "1234.5678",
          "status": "IN_USE",
          "specs": "Intel Core i5, 8GB RAM",
          "entrydate": "2023-01-15",
          "origin": "Dell Vietnam"
        },
        "room": {
          "id": "87ccafb9-9a2d-491a-9b54-7281a2c196cc",
          "name": "A01.01",
          "roomCode": "4A01.01"
        },
        "components": [
          {
            "id": "comp-uuid-1",
            "componentType": "CPU",
            "name": "Intel Core i5-3470",
            "componentSpecs": "3.2GHz, 4 cores",
            "serialNumber": "CPU-12345",
            "status": "INSTALLED",
            "installedAt": "2024-10-22T10:00:00.000Z",
            "notes": null
          },
          {
            "id": "comp-uuid-2",
            "componentType": "RAM",
            "name": "Kingston DDR3",
            "componentSpecs": "8GB 1600MHz",
            "serialNumber": null,
            "status": "INSTALLED",
            "installedAt": "2024-10-22T10:00:00.000Z",
            "notes": null
          },
          {
            "id": "comp-uuid-3",
            "componentType": "STORAGE",
            "name": "Samsung SSD",
            "componentSpecs": "256GB SATA",
            "serialNumber": "SSD-67890",
            "status": "INSTALLED",
            "installedAt": "2024-10-22T10:00:00.000Z",
            "notes": null
          }
        ],
        "componentCount": 3
      }
    ]
  }
}
```

**Error Responses:**

**404 Not Found - Invalid Room ID Format:**
```json
{
  "statusCode": 404,
  "message": "ID phòng không hợp lệ: invalid-uuid",
  "error": "Not Found"
}
```

**404 Not Found - No Computers in Room:**
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy máy tính nào trong phòng với ID: 87ccafb9-9a2d-491a-9b54-7281a2c196cc",
  "error": "Not Found"
}
```

#### Response Fields Explanation

**Computer Object:**
- `id`: UUID của máy tính
- `machineLabel`: Nhãn máy tính (ví dụ: PC-96CC-001)
- `notes`: Ghi chú về máy tính
- `componentCount`: Tổng số linh kiện của máy tính

**Asset Object (nested):**
- `id`: UUID của asset
- `name`: Tên tài sản
- `ktCode`: Mã kế toán (format: xx-yyyy/nn)
- `fixedCode`: Mã tài sản cố định (format: xxxx.yyyy)
- `status`: Trạng thái tài sản (ENUM: AssetStatus)
- `specs`: Thông số kỹ thuật
- `entrydate`: Ngày nhập tài sản
- `origin`: Xuất xứ

**Room Object (nested):**
- `id`: UUID của phòng
- `name`: Tên phòng (ví dụ: A01.01)
- `roomCode`: Mã phòng (ví dụ: 4A01.01)

**Component Object (array):**
- `id`: UUID của component
- `componentType`: Loại linh kiện (ENUM: ComponentType)
  - `CPU`, `RAM`, `STORAGE`, `GPU`, `MONITOR`, `KEYBOARD`, `MOUSE`, `OPTICAL_DRIVE`
- `name`: Tên/Model của linh kiện
- `componentSpecs`: Thông số kỹ thuật chi tiết
- `serialNumber`: Số serial (nullable)
- `status`: Trạng thái (ENUM: ComponentStatus)
  - `INSTALLED`, `REMOVED`, `DAMAGED`, `REPLACED`
- `installedAt`: Ngày lắp đặt
- `notes`: Ghi chú (nullable)

## Business Logic

### Flow của API getComputersByRoom

1. **Validation:**
   - Kiểm tra format UUID của `roomId`
   - Nếu không hợp lệ → throw NotFoundException

2. **Database Query:**
   - Sử dụng TypeORM QueryBuilder để join các bảng:
     - `computers` ← `assets` (1:1)
     - `computers` ← `rooms` (N:1)
     - `computers` ← `computer_components` (1:N)
   - Sắp xếp theo `machineLabel` (ASC) và `componentType` (ASC)

3. **Data Validation:**
   - Nếu không tìm thấy máy tính nào → throw NotFoundException

4. **Data Transformation:**
   - Transform raw entity data thành response structure
   - Tính toán `componentCount`
   - Loại bỏ các trường không cần thiết

5. **Response:**
   - Trả về structured data với metadata

## Database Schema Reference

### Bảng Liên Quan

```sql
-- computers table
computers:
  id (PK, UUID)
  assetId (FK → assets.id, unique)
  roomId (FK → rooms.id)
  machineLabel (varchar)
  notes (text, nullable)

-- computer_components table
computer_components:
  id (PK, UUID)
  computerAssetId (FK → computers.id)  ⚠️ CHÚ Ý: Join với computers.id
  componentType (ENUM)
  name (varchar)
  componentSpecs (text, nullable)
  serialNumber (varchar, nullable, unique)
  status (ENUM)
  installedAt (timestamp)
  removedAt (timestamp, nullable)
  notes (text, nullable)
```

### Foreign Key Relationships

```
assets (1) ←→ (1) computers
rooms (1) ←→ (N) computers
computers (1) ←→ (N) computer_components
```

**⚠️ QUAN TRỌNG:**
- `computer_components.computerAssetId` references `computers.id` (NOT `computers.assetId`)
- Khi join, PHẢI dùng: `cc."computerAssetId" = c.id`
- KHÔNG ĐƯỢC dùng: `cc."computerAssetId" = c."assetId"` (SAI!)

## Use Cases

### 1. Hiển thị danh sách máy tính trong phòng máy
```typescript
// Frontend call
const response = await fetch('/computer/room/87ccafb9-9a2d-491a-9b54-7281a2c196cc');
const { data } = await response.json();

// Render table
data.computers.forEach(computer => {
  console.log(`${computer.machineLabel}: ${computer.componentCount} components`);
});
```

### 2. Kiểm tra phòng máy có đầy đủ thiết bị
```typescript
const { data } = await getComputersByRoom(roomId);

data.computers.forEach(computer => {
  const requiredTypes = ['CPU', 'RAM', 'STORAGE', 'MONITOR', 'KEYBOARD', 'MOUSE'];
  const hasAllComponents = requiredTypes.every(type => 
    computer.components.some(c => c.componentType === type)
  );
  
  if (!hasAllComponents) {
    console.warn(`${computer.machineLabel} thiếu linh kiện!`);
  }
});
```

### 3. Thống kê máy tính theo trạng thái
```typescript
const { data } = await getComputersByRoom(roomId);

const stats = data.computers.reduce((acc, computer) => {
  const status = computer.asset.status;
  acc[status] = (acc[status] || 0) + 1;
  return acc;
}, {});

console.log('Thống kê:', stats);
// Output: { IN_USE: 30, UNDER_REPAIR: 3, AVAILABLE: 2 }
```

## Testing

### Test với PostgreSQL

```sql
-- Lấy danh sách rooms có máy tính
SELECT 
    r.id,
    r.name,
    r."roomCode",
    COUNT(c.id) as computer_count
FROM rooms r
LEFT JOIN computers c ON c."roomId" = r.id
GROUP BY r.id, r.name, r."roomCode"
HAVING COUNT(c.id) > 0
ORDER BY computer_count DESC
LIMIT 5;

-- Verify data cho 1 room cụ thể
SELECT 
    c."machineLabel",
    a.name as asset_name,
    COUNT(cc.id) as component_count
FROM computers c
LEFT JOIN assets a ON a.id = c."assetId"
LEFT JOIN computer_components cc ON cc."computerAssetId" = c.id
WHERE c."roomId" = '87ccafb9-9a2d-491a-9b54-7281a2c196cc'
GROUP BY c.id, c."machineLabel", a.name
ORDER BY c."machineLabel";
```

### Test với cURL

```bash
# Test với room hợp lệ
curl -X GET http://localhost:3000/computer/room/87ccafb9-9a2d-491a-9b54-7281a2c196cc

# Test với room không tồn tại
curl -X GET http://localhost:3000/computer/room/00000000-0000-0000-0000-000000000000

# Test với invalid UUID
curl -X GET http://localhost:3000/computer/room/invalid-uuid
```

## Performance Considerations

### Optimizations Implemented

1. **Single Query với Join:**
   - Sử dụng `leftJoinAndSelect` để load tất cả relations trong 1 query
   - Tránh N+1 query problem

2. **Selective Field Loading:**
   - Chỉ select các fields cần thiết trong transformation
   - Giảm payload size

3. **Indexing:**
   - `computers.roomId` nên có index (FK constraint tự động tạo)
   - `computer_components.computerAssetId` nên có index

### Potential Improvements

1. **Pagination:**
   - Thêm query params: `?page=1&limit=20`
   - Sử dụng `.skip()` và `.take()` trong QueryBuilder

2. **Filtering:**
   - Thêm filter theo `componentType`: `?componentType=CPU`
   - Thêm filter theo `assetStatus`: `?status=IN_USE`

3. **Caching:**
   - Cache kết quả với Redis
   - TTL: 5-10 phút (vì data không thay đổi thường xuyên)

4. **Partial Loading:**
   - Thêm option để không load components: `?includeComponents=false`
   - Giảm response size khi chỉ cần danh sách máy tính

## Error Handling

Service sử dụng NestJS built-in exceptions:

- `NotFoundException`: Khi không tìm thấy data hoặc invalid UUID
- Future: `BadRequestException` cho invalid query params
- Future: `InternalServerErrorException` cho database errors

## Security Considerations

### Future Implementation

1. **Authentication:**
   - Thêm `@UseGuards(JwtAuthGuard)` vào controller
   - Chỉ user đã login mới được truy cập

2. **Authorization:**
   - Kiểm tra user có quyền xem phòng này không
   - Implement role-based access control

3. **Rate Limiting:**
   - Thêm rate limiter để tránh abuse
   - Max 100 requests/minute per user

4. **Input Validation:**
   - Đã có validation UUID format
   - Future: Add DTO validation với class-validator

## Related APIs (Future)

- `GET /computer/:id` - Lấy chi tiết 1 máy tính
- `POST /computer` - Tạo máy tính mới
- `PATCH /computer/:id` - Cập nhật thông tin máy tính
- `DELETE /computer/:id` - Xóa máy tính (soft delete)
- `GET /computer/:id/components` - Lấy components của 1 máy tính
- `POST /computer/:id/components` - Thêm component vào máy tính

---

**Version:** 1.0.0  
**Last Updated:** 22/10/2025  
**Author:** Backend Team
