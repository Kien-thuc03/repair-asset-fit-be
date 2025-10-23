# Request Bodies cho Swagger Testing

> Copy-paste các JSON này vào Swagger UI để test API

## 📋 Table of Contents
- [GET /repairs/technician/assigned-floors](#1-get-assigned-floors)
- [GET /repairs/by-floor](#2-get-by-floor)
- [PUT /repairs/:id/start](#3-start-processing)

---

## 1. GET /repairs/technician/assigned-floors

**Endpoint:** `GET /repairs/technician/assigned-floors`

**Headers:**
```json
{
  "Authorization": "Bearer {your_token_here}"
}
```

**Không cần Request Body** (GET request)

**Expected Response 200:**
```json
{
  "assignedFloors": [
    {
      "building": "B",
      "floor": "1",
      "pendingRequests": 0,
      "inProgressRequests": 0,
      "waitingReplacementRequests": 0
    },
    {
      "building": "B",
      "floor": "2",
      "pendingRequests": 0,
      "inProgressRequests": 0,
      "waitingReplacementRequests": 0
    }
  ],
  "totalAssignedFloors": 2,
  "totalPendingRequests": 0
}
```

---

## 2. GET /repairs/by-floor

**Endpoint:** `GET /repairs/by-floor`

### Query Parameters (điền vào form Swagger):

```
building: B
floor: 1
status: ĐÃ_TIẾP_NHẬN
page: 1
limit: 10
```

**Hoặc URL đầy đủ:**
```
/repairs/by-floor?building=B&floor=1&status=ĐÃ_TIẾP_NHẬN&page=1&limit=10
```

**Không cần Request Body** (GET request)

**Expected Response 200:**
```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "limit": 10,
  "totalPages": 0
}
```

**Nếu có dữ liệu:**
```json
{
  "items": [
    {
      "id": "8f0d400e-74f5-4415-a668-3eb37137bda1",
      "requestCode": "YCSC-2025-0006",
      "status": "ĐÃ_TIẾP_NHẬN",
      "description": "Đang khắc phục",
      "errorType": "MAY_KHONG_KHOI_DONG",
      "computerAsset": {
        "id": "48b11d82-dee9-4003-b34d-d6063cbb230a",
        "kt_code": "1",
        "name": "Máy vi tính Vostro 270MT",
        "currentRoom": {
          "roomCode": "4A01.01",
          "building": "A",
          "floor": "1"
        }
      },
      "reportedByUser": {
        "username": "user123",
        "email": "user@example.com"
      },
      "createdAt": "2024-12-12T08:00:00.000Z"
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "totalPages": 1
}
```

---

## 3. PUT /repairs/:id/start

**Endpoint:** `PUT /repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/start`

### ✅ Test Case 1: Bắt đầu xử lý cơ bản

**Request Body:** (Copy vào Swagger)
```json
{
  "processingNotes": "Bắt đầu kiểm tra sự cố máy không khởi động. Dự kiến thời gian xử lý: 2 giờ",
  "estimatedTime": 120
}
```

**Expected Response 200:**
```json
{
  "id": "8f0d400e-74f5-4415-a668-3eb37137bda1",
  "requestCode": "YCSC-2025-0006",
  "status": "ĐANG_XỬ_LÝ",
  "description": "Đang khắc phục",
  "errorType": "MAY_KHONG_KHOI_DONG",
  "computerAssetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
  "reporterId": "...",
  "assignedTechnicianId": "47d9013d-6c7e-48d2-8443-6300632ed811",
  "resolutionNotes": "Bắt đầu kiểm tra sự cố máy không khởi động. Dự kiến thời gian xử lý: 2 giờ",
  "createdAt": "2024-12-12T08:00:00.000Z",
  "acceptedAt": "2024-12-12T09:00:00.000Z",
  "assignedTechnician": {
    "id": "47d9013d-6c7e-48d2-8443-6300632ed811",
    "username": "21011111",
    "email": "Anhtuan@gmail.com"
  }
}
```

---

### ✅ Test Case 2: Xử lý yêu cầu khẩn cấp

**Request Body:**
```json
{
  "processingNotes": "Yêu cầu khẩn cấp từ phòng giảng dạy. Ảnh hưởng đến lịch học buổi chiều. Xử lý ngay lập tức.",
  "estimatedTime": 60
}
```

**Expected Response 200:** (tương tự test case 1)

---

### ✅ Test Case 3: Xử lý sự cố phức tạp

**Request Body:**
```json
{
  "processingNotes": "Sự cố phần cứng phức tạp, có thể cần thay thế mainboard. Sẽ cập nhật tiến độ trong quá trình xử lý. Liên hệ nhà cung cấp nếu cần.",
  "estimatedTime": 240
}
```

**Expected Response 200:** (tương tự test case 1)

---

### ❌ Test Case 4: ERROR - processingNotes trống

**Request Body:**
```json
{
  "estimatedTime": 90
}
```

**Expected Response 400:**
```json
{
  "statusCode": 400,
  "message": [
    "Ghi chú xử lý không được để trống",
    "Ghi chú phải là chuỗi ký tự"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Test Case 5: ERROR - estimatedTime quá lớn

**Request Body:**
```json
{
  "processingNotes": "Bắt đầu xử lý",
  "estimatedTime": 500
}
```

**Expected Response 400:**
```json
{
  "statusCode": 400,
  "message": [
    "Thời gian ước tính tối đa 480 phút (8 giờ)"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Test Case 6: ERROR - estimatedTime quá nhỏ

**Request Body:**
```json
{
  "processingNotes": "Bắt đầu xử lý",
  "estimatedTime": 3
}
```

**Expected Response 400:**
```json
{
  "statusCode": 400,
  "message": [
    "Thời gian ước tính tối thiểu 5 phút"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Test Case 7: ERROR - processingNotes quá dài

**Request Body:**
```json
{
  "processingNotes": "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  "estimatedTime": 90
}
```

**Expected Response 400:**
```json
{
  "statusCode": 400,
  "message": [
    "Ghi chú không được vượt quá 1000 ký tự"
  ],
  "error": "Bad Request"
}
```

---

### ❌ Test Case 8: ERROR - Không thuộc tầng được phân công

**Prerequisites:**
- Dùng token kỹ thuật viên được phân công tầng B-1, B-2
- Cố gắng nhận yêu cầu tại tầng A-1

**Request Body:**
```json
{
  "processingNotes": "Bắt đầu xử lý yêu cầu",
  "estimatedTime": 90
}
```

**Expected Response 403:**
```json
{
  "statusCode": 403,
  "message": "Yêu cầu này không nằm trong tầng mà bạn được phân công (B-1, B-2)",
  "error": "Forbidden"
}
```

---

### ❌ Test Case 9: ERROR - Kỹ thuật viên quá tải

**Prerequisites:**
- Kỹ thuật viên đã có 5 yêu cầu đang xử lý

**Request Body:**
```json
{
  "processingNotes": "Bắt đầu xử lý yêu cầu mới",
  "estimatedTime": 90
}
```

**Expected Response 400:**
```json
{
  "statusCode": 400,
  "message": "Bạn đang xử lý quá nhiều yêu cầu cùng lúc (5/5)",
  "error": "Bad Request"
}
```

---

### ❌ Test Case 10: ERROR - Trạng thái không hợp lệ

**Prerequisites:**
- Yêu cầu đang ở trạng thái CHỜ_TIẾP_NHẬN (chưa được accept)

**Request Body:**
```json
{
  "processingNotes": "Bắt đầu xử lý",
  "estimatedTime": 90
}
```

**Expected Response 400:**
```json
{
  "statusCode": 400,
  "message": "Chỉ có thể bắt đầu xử lý yêu cầu đã được tiếp nhận",
  "error": "Bad Request"
}
```

---

### ❌ Test Case 11: ERROR - Yêu cầu không tồn tại

**Endpoint:** `PUT /repairs/00000000-0000-0000-0000-000000000000/start`

**Request Body:**
```json
{
  "processingNotes": "Bắt đầu xử lý",
  "estimatedTime": 90
}
```

**Expected Response 404:**
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy yêu cầu sửa chữa với ID: 00000000-0000-0000-0000-000000000000",
  "error": "Not Found"
}
```

---

## 🔧 Hướng dẫn Test trên Swagger UI

### Bước 1: Mở Swagger UI
```
http://localhost:3000/api
```

### Bước 2: Authenticate
1. Click nút **Authorize** (khóa ở góc phải trên)
2. Nhập: `Bearer {your_token_here}`
3. Click **Authorize** → **Close**

### Bước 3: Test GET endpoints

#### Test GET /repairs/technician/assigned-floors:
1. Mở endpoint
2. Click **Try it out**
3. Click **Execute**
4. Xem Response

#### Test GET /repairs/by-floor:
1. Mở endpoint
2. Click **Try it out**
3. Điền parameters:
   - `building`: B
   - `floor`: 1
   - `status`: ĐÃ_TIẾP_NHẬN
4. Click **Execute**
5. Xem Response

### Bước 4: Test PUT /repairs/:id/start

1. Mở endpoint `PUT /repairs/{id}/start`
2. Click **Try it out**
3. Điền `id`: `8f0d400e-74f5-4415-a668-3eb37137bda1`
4. **Copy một trong các Request Body** từ trên vào ô Request body
5. Click **Execute**
6. Xem Response code và body

### Bước 5: Test Error Cases

Làm tương tự nhưng dùng các Request Body có lỗi để kiểm tra validation

---

## 📝 Notes

### IDs thực tế trong database:
- **Repair Request ID**: `8f0d400e-74f5-4415-a668-3eb37137bda1`
- **Asset ID**: `48b11d82-dee9-4003-b34d-d6063cbb230a`
- **Technician ID**: `47d9013d-6c7e-48d2-8443-6300632ed811`

### Status transitions:
```
CHỜ_TIẾP_NHẬN → ĐÃ_TIẾP_NHẬN → ĐANG_XỬ_LÝ → ĐÃ_HOÀN_THÀNH
```

### Trước khi test PUT /repairs/:id/start:
1. ✅ Yêu cầu phải được accept trước (status = ĐÃ_TIẾP_NHẬN)
2. ✅ User phải có quyền kỹ thuật viên
3. ✅ Yêu cầu phải thuộc tầng được phân công (hoặc dùng admin)

### Copy-paste nhanh:

**Request body cơ bản nhất:**
```json
{
  "processingNotes": "Bắt đầu xử lý",
  "estimatedTime": 90
}
```

**Request body đầy đủ:**
```json
{
  "processingNotes": "Bắt đầu kiểm tra sự cố máy không khởi động. Kiểm tra nguồn điện, RAM, và mainboard. Dự kiến thời gian xử lý: 2 giờ.",
  "estimatedTime": 120
}
```
