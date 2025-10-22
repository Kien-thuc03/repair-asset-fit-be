# Software Proposals Quick Reference

## 🚀 Quick Start

### 1. Tạo đề xuất phần mềm đơn giản

```bash
curl -X POST http://localhost:3000/api/v1/software-proposals \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "roomId": "87ccafb9-9a2d-491a-9b54-7281a2c196cc",
    "reason": "Cần Microsoft Office cho lớp học",
    "items": [{
      "softwareName": "Microsoft Office 2021",
      "version": "2021",
      "quantity": 30,
      "licenseType": "Vĩnh viễn"
    }]
  }'
```

### 2. Lấy danh sách đề xuất

```bash
curl -X GET "http://localhost:3000/api/v1/software-proposals?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 3. Duyệt đề xuất

```bash
curl -X PUT http://localhost:3000/api/v1/software-proposals/{ID}/approve \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 📋 Trạng thái đề xuất

| Trạng thái      | Mô tả             | Hành động có thể         |
| --------------- | ----------------- | ------------------------ |
| **CHỜ_DUYỆT**   | Đề xuất mới tạo   | Sửa, Xóa, Duyệt, Từ chối |
| **ĐÃ_DUYỆT**    | Đã được phê duyệt | Đánh dấu trang bị        |
| **ĐÃ_TỪ_CHỐI**  | Bị từ chối        | Sửa, Xóa, Gửi lại        |
| **ĐÃ_TRANG_BỊ** | Hoàn thành        | Chỉ xem                  |

## 🔧 Endpoints chính

| Method | Endpoint                                | Mô tả               |
| ------ | --------------------------------------- | ------------------- |
| POST   | `/software-proposals`                   | Tạo đề xuất mới     |
| GET    | `/software-proposals`                   | Danh sách đề xuất   |
| GET    | `/software-proposals/:id`               | Chi tiết đề xuất    |
| PUT    | `/software-proposals/:id`               | Cập nhật đề xuất    |
| PUT    | `/software-proposals/:id/approve`       | Duyệt đề xuất       |
| PUT    | `/software-proposals/:id/reject`        | Từ chối đề xuất     |
| PUT    | `/software-proposals/:id/mark-equipped` | Đánh dấu hoàn thành |
| DELETE | `/software-proposals/:id`               | Xóa đề xuất         |

## 🔍 Filter options

```javascript
// URL params cho GET /software-proposals
{
  roomId: "uuid",           // Lọc theo phòng
  proposerId: "uuid",       // Lọc theo người tạo
  approverId: "uuid",       // Lọc theo người duyệt
  status: "CHỜ_DUYỆT",      // Lọc theo trạng thái
  search: "text",           // Tìm kiếm
  fromDate: "2025-01-01",   // Từ ngày
  toDate: "2025-12-31",     // Đến ngày
  page: 1,                  // Số trang
  limit: 10,                // Số lượng/trang
  sortBy: "createdAt",      // Trường sắp xếp
  sortOrder: "DESC"         // Thứ tự sắp xếp
}
```

## 📝 Body templates

### Đề xuất 1 phần mềm

```json
{
  "roomId": "room-uuid",
  "reason": "Lý do cần phần mềm",
  "items": [
    {
      "softwareName": "Tên phần mềm",
      "version": "Phiên bản",
      "publisher": "Nhà sản xuất",
      "quantity": 30,
      "licenseType": "Loại license"
    }
  ]
}
```

### Đề xuất nhiều phần mềm

```json
{
  "roomId": "room-uuid",
  "reason": "Cần bộ phần mềm thiết kế",
  "items": [
    {
      "softwareName": "Adobe Photoshop",
      "version": "2024",
      "quantity": 25
    },
    {
      "softwareName": "Adobe Illustrator",
      "version": "2024",
      "quantity": 25
    },
    {
      "softwareName": "AutoCAD",
      "version": "2024",
      "quantity": 20
    }
  ]
}
```

### Cập nhật đề xuất

```json
{
  "reason": "Lý do đã cập nhật",
  "status": "ĐÃ_DUYỆT"
}
```

## ⚡ Response format

### Success Response

```json
{
  "id": "uuid",
  "proposalCode": "DXPM-2025-0001",
  "proposerId": "uuid",
  "roomId": "uuid",
  "reason": "string",
  "status": "CHỜ_DUYỆT",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "proposer": { "id": "uuid", "fullName": "string", "email": "string" },
  "room": { "id": "uuid", "name": "string", "building": "string" },
  "items": [
    {
      "id": "uuid",
      "softwareName": "string",
      "version": "string",
      "quantity": 30
    }
  ]
}
```

### List Response

```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

### Error Response

```json
{
  "statusCode": 400,
  "message": "Thông báo lỗi",
  "error": "Bad Request"
}
```

## 🔐 Authentication

Tất cả requests cần header:

```
Authorization: Bearer <JWT_TOKEN>
```

## 🚨 Common Errors

| Status | Error                | Giải pháp                |
| ------ | -------------------- | ------------------------ |
| 400    | Dữ liệu không hợp lệ | Kiểm tra validation      |
| 401    | Chưa đăng nhập       | Thêm JWT token           |
| 403    | Không có quyền       | Kiểm tra role/permission |
| 404    | Không tìm thấy       | Kiểm tra ID              |
| 409    | Trùng lặp            | Kiểm tra unique fields   |

## 📊 Sample Data

### Rooms

```
ID: 87ccafb9-9a2d-491a-9b54-7281a2c196cc (A01.01)
ID: 1af73d38-a424-4beb-8104-2368b79925e5 (A01.02)
```

### Users

```
ID: c6660b91-ef5e-4726-b003-b4f7980a8e90 (Nguyễn Xuân Hồng)
ID: 5c345ca6-02aa-41ef-924d-1fb427ce6e1c (Hoàng Kim Phước)
```

## 💡 Best Practices

1. **Validation**: Luôn validate input trước khi gửi
2. **Error Handling**: Xử lý tất cả error codes
3. **Pagination**: Sử dụng page/limit cho danh sách lớn
4. **Filtering**: Dùng filter để giảm tải server
5. **Authentication**: Luôn include JWT token
6. **Logging**: Log tất cả requests quan trọng

## 🔧 Swagger UI

Truy cập `http://localhost:3000/api/docs` để test interactive với Swagger UI.

## 📞 Support

- **Module**: SoftwareProposalsModule
- **Controller**: SoftwareProposalsController
- **Service**: SoftwareProposalsService
- **Entities**: SoftwareProposal, SoftwareProposalItem
