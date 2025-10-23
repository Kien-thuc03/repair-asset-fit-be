# Hướng dẫn Test API Yêu cầu Sửa chữa - Quy trình cập nhật

## Tổng quan quy trình mới

**Thay đổi quan trọng**: Hệ thống không còn phân công thủ công. Kỹ thuật viên tự quản lý yêu cầu theo tầng được phân công.

### Quy trình làm việc mới:
1. **Giảng viên/NV tạo yêu cầu** → Status: `CHỜ_TIẾP_NHẬN`
2. **QTV Khoa tiếp nhận** → Status: `ĐÃ_TIẾP_NHẬN` 
3. **Kỹ thuật viên tự xem và nhận yêu cầu theo tầng** → Status: `ĐANG_XỬ_LÝ`
4. **Kỹ thuật viên hoàn thành** → Status: `HOÀN_THÀNH`

## Phân công tầng trong database

```sql
-- Bảng technician_assignments
SELECT ta.*, u.username, u.email 
FROM technician_assignments ta
JOIN users u ON ta.technician_id = u.id;

-- Kết quả hiện tại:
-- Kỹ thuật viên "21011111" được phân công: Building B, Tầng 1,2
```

## Endpoints đã cập nhật

### 1. Lấy tầng được phân công
```http
GET /repairs/technician/assigned-floors
Authorization: Bearer {token_ky_thuat_vien}
```

### 2. Xem yêu cầu theo tầng  
```http
GET /repairs/by-floor?building=B&floor=1
Authorization: Bearer {token_ky_thuat_vien}
```

### 3. Tự nhận và bắt đầu xử lý
```http
PUT /repairs/{id}/start
Authorization: Bearer {token_ky_thuat_vien}
Content-Type: application/json

{
  "processingNotes": "Bắt đầu kiểm tra sự cố máy tính không khởi động được",
  "estimatedTime": 120
}
```

## Test Cases theo quy trình mới

### Test Case 1: Kỹ thuật viên xem tầng được phân công
**Endpoint:** `GET /repairs/technician/assigned-floors`
**User:** Kỹ thuật viên (21011111)
**Expected:**
```json
{
  "assignedFloors": [
    {
      "building": "B",
      "floor": "1", 
      "pendingRequests": 3,
      "inProgressRequests": 1
    },
    {
      "building": "B",
      "floor": "2",
      "pendingRequests": 2,
      "inProgressRequests": 0
    }
  ]
}
```

### Test Case 2: Xem yêu cầu trong tầng B-1
**Endpoint:** `GET /repairs/by-floor?building=B&floor=1`  
**User:** Kỹ thuật viên (21011111)
**Expected:** Chỉ thấy yêu cầu của phòng trong tòa B tầng 1

### Test Case 3: Kỹ thuật viên tự nhận yêu cầu
**Endpoint:** `PUT /repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/start`
**User:** Kỹ thuật viên (21011111)  
**Body:**
```json
{
  "processingNotes": "Bắt đầu kiểm tra sự cố máy tính tại phòng B101",
  "estimatedTime": 90
}
```
**Expected:**
- Status chuyển từ `ĐÃ_TIẾP_NHẬN` → `ĐANG_XỬ_LÝ`
- `assignedTechnician` được set tự động
- Ghi log vào `repair_logs`

### Test Case 4: Từ chối yêu cầu không thuộc tầng
**Endpoint:** `PUT /repairs/{id_yeu_cau_tang_khac}/start`
**User:** Kỹ thuật viên B1,B2 (21011111)
**Scenario:** Cố gắng nhận yêu cầu tại tầng A-1  
**Expected:** HTTP 403 - "Yêu cầu không thuộc tầng được phân công"

### Test Case 5: Tổ trưởng xem tất cả
**Endpoint:** `GET /repairs/by-floor`
**User:** Tổ trưởng kỹ thuật 
**Expected:** Xem được tất cả yêu cầu ở mọi tầng

## Dữ liệu test thực tế

```sql
-- Yêu cầu test có thể dùng:
SELECT rr.id, rr.request_code, rr.status, r.building, r.floor_number
FROM repair_requests rr
JOIN assets a ON rr.asset_id = a.id  
JOIN rooms r ON a.current_room_id = r.id
WHERE rr.status = 'ĐÃ_TIẾP_NHẬN'
ORDER BY r.building, r.floor_number;

-- ID thực: 8f0d400e-74f5-4415-a668-3eb37137bda1 (YCSC-2025-0006)
-- Tài sản: Máy tính tại phòng B103 (Tầng 1, Tòa B)
```

## Lưu ý quan trọng

1. **Không còn endpoint phân công**: `/repairs/:id/assign` đã được xóa
2. **Tự động phân công**: Khi kỹ thuật viên `/start`, hệ thống tự gán `assignedTechnicianId`
3. **Kiểm tra tầng**: Hệ thống validate yêu cầu có thuộc tầng được phân công không
4. **Quản lý tải**: Kiểm tra số lượng yêu cầu đang xử lý của kỹ thuật viên