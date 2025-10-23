# Tổng kết cập nhật quy trình Yêu cầu Sửa chữa

## 📋 Tổng quan thay đổi

Cập nhật hệ thống sửa chữa từ **quy trình phân công thủ công** sang **quy trình tự quản lý theo tầng**.

### Quy trình CŨ (Đã loại bỏ)

```
1. Giảng viên tạo yêu cầu
2. QTV Khoa tiếp nhận
3. Tổ trưởng/QTV phân công cho kỹ thuật viên cụ thể (thủ công)
4. Kỹ thuật viên được assign bắt đầu xử lý
5. Hoàn thành
```

### Quy trình MỚI (Hiện tại)

```
1. Giảng viên tạo yêu cầu → Status: CHỜ_TIẾP_NHẬN
2. QTV Khoa tiếp nhận → Status: ĐÃ_TIẾP_NHẬN
3. Kỹ thuật viên TỰ XEM yêu cầu trong tầng được phân công
4. Kỹ thuật viên TỰ NHẬN và bắt đầu xử lý → Status: ĐANG_XỬ_LÝ
5. Hoàn thành → Status: ĐÃ_HOÀN_THÀNH
```

## 🔧 Thay đổi kỹ thuật

### 1. Entity & Database

#### Đã sử dụng

- ✅ `TechnicianAssignment` entity (đã có sẵn)
  - Bảng: `technician_assignments`
  - Columns: `technicianId`, `building`, `floor`
  - Mục đích: Lưu phân công tầng cho kỹ thuật viên

#### Dữ liệu mẫu

```sql
SELECT ta.*, u.username, u.email
FROM technician_assignments ta
JOIN users u ON ta."technicianId" = u.id;

-- Kết quả:
-- Kỹ thuật viên "21011111" (Anhtuan@gmail.com)
-- Phụ trách: Building B, Tầng 1 và 2
```

### 2. API Endpoints

#### ❌ Đã XÓA

```typescript
PUT /repairs/:id/assign  // Phân công thủ công - không còn cần
```

#### ✅ Đã THÊM MỚI

```typescript
// 1. Xem tầng được phân công
GET /repairs/technician/assigned-floors
Response: {
  assignedFloors: [
    { building: "B", floor: "1", pendingRequests: 3, ... },
    { building: "B", floor: "2", pendingRequests: 1, ... }
  ],
  totalAssignedFloors: 2,
  totalPendingRequests: 4
}

// 2. Xem yêu cầu theo tầng
GET /repairs/by-floor?building=B&floor=1
Query params: building, floor, status
Response: {
  items: [...repair requests...],
  total: 10,
  page: 1,
  limit: 20
}

// 3. Tự nhận và bắt đầu xử lý (cập nhật)
PUT /repairs/:id/start
Body: {
  processingNotes: "Bắt đầu kiểm tra...",
  estimatedTime: 120  // phút
}
```

### 3. DTOs

#### ❌ Đã XÓA

- `AssignTechnicianDto` - Không còn cần phân công thủ công

#### ✅ Đã TẠO MỚI

```typescript
// dto/start-processing.dto.ts
export class StartProcessingDto {
  @IsNotEmpty()
  @MaxLength(1000)
  processingNotes: string;

  @IsOptional()
  @Min(5)
  @Max(480)
  estimatedTime?: number; // phút
}
```

### 4. Service Methods

#### ❌ Đã XÓA

```typescript
assignTechnician(); // Phân công thủ công
canUserAssignTechnician(); // Kiểm tra quyền phân công
```

#### ✅ Đã THÊM MỚI

```typescript
// 1. Lấy tầng được phân công
async getAssignedFloors(user: User)
- Kỹ thuật viên: Xem tầng trong TechnicianAssignment
- Admin/Tổ trưởng: Xem tất cả tầng
- Kèm thống kê: pending, in_progress, waiting_replacement

// 2. Lấy yêu cầu theo tầng
async findByFloor(filter, user: User)
- Kỹ thuật viên: Chỉ xem yêu cầu trong tầng được assign
- Admin/Tổ trưởng: Xem tất cả
- Filter: building, floor, status, errorType, search
- Auto-filter theo building+floor của asset.currentRoom

// 3. Tự nhận và bắt đầu xử lý
async startProcessing(id, startDto, user)
- Kiểm tra yêu cầu thuộc tầng được phân công
- Kiểm tra không quá tải (max 5 yêu cầu đồng thời)
- Tự động gán assignedTechnicianId
- Chuyển status: ĐÃ_TIẾP_NHẬN → ĐANG_XỬ_LÝ
- Lưu processingNotes và estimatedTime
```

#### 🔄 Helper mới

```typescript
private async getFloorStatistics(building, floor)
- Đếm số yêu cầu theo status cho một tầng cụ thể
- Return: pendingRequests, inProgressRequests, waitingReplacementRequests
```

### 5. Module Updates

```typescript
// repairs.module.ts
imports: [
  TypeOrmModule.forFeature([
    // ... existing entities
    TechnicianAssignment, // ✅ THÊM MỚI
    Room, // ✅ THÊM MỚI (để join lấy building/floor)
  ]),
];
```

## 🔐 Quyền hạn & Logic

### Kỹ thuật viên thường

- ✅ Xem tầng được phân công (`getAssignedFloors`)
- ✅ Xem yêu cầu TRONG tầng được assign (`findByFloor`)
- ✅ Tự nhận yêu cầu TRONG tầng được assign (`startProcessing`)
- ❌ Không thể nhận yêu cầu NGOÀI tầng được assign
- ❌ Tối đa 5 yêu cầu đồng thời

### Tổ trưởng Kỹ thuật / Admin

- ✅ Xem TẤT CẢ tầng
- ✅ Xem TẤT CẢ yêu cầu
- ✅ Nhận bất kỳ yêu cầu nào
- ✅ Không giới hạn số lượng yêu cầu đồng thời

## 📊 Validation Logic

### Khi tự nhận yêu cầu (`startProcessing`)

1. **Kiểm tra status**

   ```typescript
   if (status !== RepairStatus.ĐÃ_TIẾP_NHẬN) {
     throw BadRequestException(
       "Chỉ có thể bắt đầu xử lý yêu cầu đã được tiếp nhận"
     );
   }
   ```

2. **Kiểm tra tầng (chỉ kỹ thuật viên thường)**

   ```typescript
   const room = repairRequest.computerAsset.currentRoom;
   const assignments = await technicianAssignmentRepository.find({
     technicianId,
   });

   const isAssignedToFloor = assignments.some(
     (a) => a.building === room.building && a.floor === room.floor
   );

   if (!isAssignedToFloor) {
     throw ForbiddenException("Không thuộc tầng được phân công");
   }
   ```

3. **Kiểm tra quá tải**

   ```typescript
   const ongoingCount = await repairRequestRepository.count({
     assignedTechnicianId: user.id,
     status: RepairStatus.ĐANG_XỬ_LÝ,
   });

   if (ongoingCount >= 5) {
     throw BadRequestException("Đang xử lý quá nhiều yêu cầu (5/5)");
   }
   ```

4. **Tự động gán và chuyển status**
   ```typescript
   repairRequest.assignedTechnicianId = currentUser.id;
   repairRequest.status = RepairStatus.ĐANG_XỬ_LÝ;
   repairRequest.resolutionNotes = startDto.processingNotes;
   ```

## 🧪 Testing Scenarios

### Scenario 1: Kỹ thuật viên xem tầng được phân công

```http
GET /repairs/technician/assigned-floors
Authorization: Bearer {token_kỹ_thuật_viên_21011111}

Expected Response:
{
  "assignedFloors": [
    { "building": "B", "floor": "1", "pendingRequests": 3 },
    { "building": "B", "floor": "2", "pendingRequests": 1 }
  ],
  "totalAssignedFloors": 2,
  "totalPendingRequests": 4
}
```

### Scenario 2: Xem yêu cầu trong tầng B-1

```http
GET /repairs/by-floor?building=B&floor=1&status=ĐÃ_TIẾP_NHẬN
Authorization: Bearer {token_kỹ_thuật_viên_21011111}

Expected: Danh sách yêu cầu chỉ từ phòng trong tòa B tầng 1
```

### Scenario 3: Tự nhận yêu cầu

```http
PUT /repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/start
Authorization: Bearer {token_kỹ_thuật_viên_21011111}
Content-Type: application/json

{
  "processingNotes": "Bắt đầu kiểm tra sự cố máy tính tại phòng B103",
  "estimatedTime": 90
}

Expected:
- Status: ĐÃ_TIẾP_NHẬN → ĐANG_XỬ_LÝ
- assignedTechnicianId = user.id
- HTTP 200 OK
```

### Scenario 4: Từ chối yêu cầu ngoài tầng

```http
PUT /repairs/{id_yêu_cầu_tại_A-1}/start
Authorization: Bearer {token_kỹ_thuật_viên_B1_B2}

Expected:
- HTTP 403 Forbidden
- Message: "Không thuộc tầng được phân công (B-1, B-2)"
```

### Scenario 5: Từ chối khi quá tải

```http
PUT /repairs/{id}/start
Authorization: Bearer {token_kỹ_thuật_viên_đang_xử_lý_5_yêu_cầu}

Expected:
- HTTP 400 Bad Request
- Message: "Đang xử lý quá nhiều yêu cầu (5/5)"
```

## 📁 Files đã thay đổi

### Modified

```
src/modules/repairs/
├── repairs.controller.ts       ✅ Xóa endpoint assign, thêm mới 3 endpoints
├── repairs.service.ts          ✅ Xóa assignTechnician, thêm 3 methods mới
├── repairs.module.ts           ✅ Import TechnicianAssignment & Room
└── dto/
    ├── start-processing.dto.ts ✅ TẠO MỚI
    └── assign-technician.dto.ts ❌ ĐÃ XÓA
```

### Documentation

```
docs/
├── REPAIRS_UPDATED_API_GUIDE.md        ✅ TẠO MỚI - Hướng dẫn test API mới
└── REPAIRS_WORKFLOW_UPDATE_SUMMARY.md  ✅ TẠO MỚI - File này
```

## 🚀 Deployment Notes

1. **Không cần migration** - Sử dụng bảng `technician_assignments` có sẵn
2. **Cần seed data** - Đảm bảo có dữ liệu trong `technician_assignments`
3. **Breaking changes** - Endpoint `/repairs/:id/assign` đã bị xóa
4. **Frontend update** - Cần cập nhật UI theo quy trình mới

## 📝 TODO/Future Improvements

- [ ] Thêm field `estimatedCompletionTime` vào RepairRequest entity
- [ ] Implement RepairLogs để ghi lại toàn bộ lịch sử status changes
- [ ] Thêm notification khi có yêu cầu mới trong tầng
- [ ] Dashboard thống kê theo tầng/building
- [ ] Auto-suggest yêu cầu dựa trên workload của kỹ thuật viên
- [ ] Báo cáo hiệu suất theo tầng/kỹ thuật viên

## ✅ Checklist hoàn thành

- [x] Xóa AssignTechnicianDto
- [x] Tạo StartProcessingDto
- [x] Xóa endpoint assign trong controller
- [x] Thêm endpoint getAssignedFloors
- [x] Thêm endpoint findByFloor
- [x] Cập nhật endpoint start
- [x] Implement getAssignedFloors trong service
- [x] Implement findByFloor trong service
- [x] Cập nhật startProcessing với validation tầng
- [x] Thêm getFloorStatistics helper
- [x] Xóa assignTechnician trong service
- [x] Xóa canUserAssignTechnician
- [x] Update module imports (TechnicianAssignment, Room)
- [x] Kiểm tra và sửa tất cả compile errors
- [x] Viết documentation

---

**Ngày cập nhật:** 2024-12-12  
**Người thực hiện:** AI Agent  
**Version:** 2.0.0 - Self-managed Floor-based Workflow
