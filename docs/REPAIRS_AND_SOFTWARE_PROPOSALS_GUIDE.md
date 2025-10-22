# Hệ thống Quản lý Sửa chữa và Đề xuất Phần mềm

## Tổng quan

Hệ thống bao gồm hai module chính được thiết kế theo cùng một pattern để quản lý quy trình sửa chữa tài sản và đề xuất phần mềm:

1. **Repairs Module** - Quản lý yêu cầu sửa chữa tài sản
2. **Software Proposals Module** - Quản lý đề xuất mua/trang bị phần mềm

## Repairs Module - Quản lý Sửa chữa

### 🔄 Quy trình Workflow

```
CHỜ_TIẾP_NHẬN → ĐÃ_TIẾP_NHẬN → ĐANG_XỬ_LÝ → ĐÃ_HOÀN_THÀNH
     ↓              ↓              ↓
   ĐÃ_HỦY         ĐÃ_HỦY       CHỜ_THAY_THẾ
                                    ↓
                               ĐÃ_HOÀN_THÀNH
```

### 📋 API Endpoints

| Method | Endpoint | Mô tả | Quyền hạn |
|--------|----------|--------|-----------|
| POST | `/repairs` | Tạo yêu cầu sửa chữa mới | User |
| GET | `/repairs` | Danh sách yêu cầu (có filter) | User |
| GET | `/repairs/:id` | Chi tiết yêu cầu | User |
| PUT | `/repairs/:id` | Cập nhật yêu cầu | Owner/Technician/Admin |
| PUT | `/repairs/:id/accept` | Tiếp nhận yêu cầu | Technician/Admin |
| PUT | `/repairs/:id/assign` | Phân công kỹ thuật viên | Admin/Lead |
| PUT | `/repairs/:id/start-processing` | Bắt đầu xử lý | Assigned Technician |
| PUT | `/repairs/:id/complete` | Hoàn thành sửa chữa | Assigned Technician/Admin |
| PUT | `/repairs/:id/cancel` | Hủy yêu cầu | Owner/Admin |

### 💼 Quy trình nghiệp vụ

#### 1. Tạo yêu cầu sửa chữa
- User báo lỗi tài sản (máy tính)
- Hệ thống sinh mã tự động: `YCSC-YYYY-NNNN`
- Trạng thái ban đầu: `CHỜ_TIẾP_NHẬN`
- Cập nhật trạng thái tài sản thành `DAMAGED`

#### 2. Tiếp nhận và phân công
- Kỹ thuật viên/Admin tiếp nhận: `ĐÃ_TIẾP_NHẬN`
- Admin phân công kỹ thuật viên cụ thể
- Kỹ thuật viên bắt đầu xử lý: `ĐANG_XỬ_LÝ`

#### 3. Xử lý sửa chữa
- Nếu cần thay thế linh kiện: `CHỜ_THAY_THẾ`
- Hoàn thành sửa chữa: `ĐÃ_HOÀN_THÀNH`
- Khôi phục trạng thái tài sản: `IN_USE`

## Software Proposals Module - Đề xuất Phần mềm

### 🔄 Quy trình Workflow

```
CHỜ_DUYỆT → ĐÃ_DUYỆT → ĐÃ_TRANG_BỊ
     ↓
  ĐÃ_TỪ_CHỐI
```

### 📋 API Endpoints

| Method | Endpoint | Mô tả | Quyền hạn |
|--------|----------|--------|-----------|
| POST | `/software-proposals` | Tạo đề xuất mới | User |
| GET | `/software-proposals` | Danh sách đề xuất (có filter) | User |
| GET | `/software-proposals/:id` | Chi tiết đề xuất | User |
| PUT | `/software-proposals/:id` | Cập nhật đề xuất | Owner/Admin |
| PUT | `/software-proposals/:id/approve` | Duyệt đề xuất | Admin/Manager |
| PUT | `/software-proposals/:id/reject` | Từ chối đề xuất | Admin/Manager |
| PUT | `/software-proposals/:id/mark-equipped` | Đánh dấu hoàn thành | Admin |
| DELETE | `/software-proposals/:id` | Xóa đề xuất | Owner/Admin |

### 💼 Quy trình nghiệp vụ

#### 1. Tạo đề xuất phần mềm
- User tạo đề xuất cho phòng máy
- Có thể đề xuất nhiều phần mềm cùng lúc
- Hệ thống sinh mã tự động: `DXPM-YYYY-NNNN`
- Trạng thái ban đầu: `CHỜ_DUYỆT`

#### 2. Xét duyệt đề xuất
- Admin/Manager xem xét và duyệt: `ĐÃ_DUYỆT`
- Hoặc từ chối với lý do: `ĐÃ_TỪ_CHỐI`
- Đề xuất bị từ chối có thể chỉnh sửa và gửi lại

#### 3. Thực hiện đề xuất
- Sau khi duyệt, tiến hành mua phần mềm
- Cài đặt phần mềm lên các máy trong phòng
- Đánh dấu hoàn thành: `ĐÃ_TRANG_BỊ`

## Điểm chung giữa hai modules

### 🏗️ Kiến trúc chung
- **Controller-Service-Repository pattern**
- **Comprehensive DTO validation**
- **Swagger documentation với examples**
- **Business logic validation trong service**
- **Role-based access control**

### 🔐 Bảo mật
- **JWT Authentication** cho tất cả endpoints
- **Phân quyền chi tiết** theo role và ownership
- **Input validation** nghiêm ngặt
- **SQL injection protection** qua TypeORM

### 📊 Tính năng nâng cao
- **Advanced filtering**: theo nhiều tiêu chí
- **Search functionality**: tìm kiếm văn bản
- **Pagination**: hỗ trợ phân trang
- **Sorting**: sắp xếp đa tiêu chí
- **Transaction support**: đảm bảo data consistency

### 🛠️ Error Handling
- **Comprehensive error responses**
- **Business validation errors**
- **HTTP status codes phù hợp**
- **Vietnamese error messages**

## Examples

### Tạo yêu cầu sửa chữa
```bash
POST /api/v1/repairs
{
  "computerAssetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
  "description": "Máy tính không khởi động được, có mùi cháy từ nguồn điện",
  "errorType": "MAY_KHONG_KHOI_DONG",
  "mediaUrls": ["https://example.com/image1.jpg"]
}
```

### Tạo đề xuất phần mềm
```bash
POST /api/v1/software-proposals
{
  "roomId": "87ccafb9-9a2d-491a-9b54-7281a2c196cc",
  "reason": "Phòng máy tính cần Microsoft Office để phục vụ giảng dạy",
  "items": [
    {
      "softwareName": "Microsoft Office 2021 Professional Plus",
      "version": "2021",
      "quantity": 30,
      "licenseType": "Vĩnh viễn"
    }
  ]
}
```

### Phân công kỹ thuật viên
```bash
PUT /api/v1/repairs/{id}/assign
{
  "technicianId": "5c345ca6-02aa-41ef-924d-1fb427ce6e1c",
  "assignmentNotes": "Kỹ thuật viên có kinh nghiệm về phần cứng"
}
```

### Duyệt đề xuất phần mềm
```bash
PUT /api/v1/software-proposals/{id}/approve
```

## Database Schema

### Repairs Tables
- `repair_requests`: Yêu cầu sửa chữa chính
- `repair_logs`: Lịch sử thay đổi trạng thái
- `repair_request_components`: Linh kiện cần thay thế

### Software Proposals Tables
- `software_proposals`: Đề xuất phần mềm chính
- `software_proposal_items`: Chi tiết phần mềm trong đề xuất

### Shared Tables
- `users`: Người dùng và phân quyền
- `roles`: Các vai trò trong hệ thống
- `assets`: Tài sản (máy tính, thiết bị)
- `rooms`: Phòng máy/văn phòng
- `units`: Đơn vị tổ chức

## Testing

### Swagger UI
- Truy cập: `http://localhost:3000/api/docs`
- Test các endpoint với data mẫu
- Xem schema và examples chi tiết

### Sample Data
```javascript
// Room IDs
87ccafb9-9a2d-491a-9b54-7281a2c196cc // A01.01
1af73d38-a424-4beb-8104-2368b79925e5 // A01.02

// User IDs  
c6660b91-ef5e-4726-b003-b4f7980a8e90 // Nguyễn Xuân Hồng
5c345ca6-02aa-41ef-924d-1fb427ce6e1c // Hoàng Kim Phước

// Asset ID
48b11d82-dee9-4003-b34d-d6063cbb230a // Máy vi tính Vostro 270MT
```

## Performance

### Database Optimization
- **Indexes** trên các trường filter chính
- **Query optimization** với proper joins
- **Pagination** để giới hạn kết quả
- **Transaction management** cho operations phức tạp

### API Performance
- **Response transformation** với class-transformer
- **Eager loading** relations khi cần thiết
- **Query builders** cho complex filters
- **Rate limiting** để bảo vệ hệ thống

## Monitoring & Logging

### Error Tracking
- Comprehensive error messages
- Request/response logging
- Performance monitoring
- Business logic validation logs

### Audit Trail
- User action tracking
- Status change history
- Data modification logs
- Security event monitoring

## Future Enhancements

### Repairs Module
1. **Automated assignment** dựa trên workload và skills
2. **SLA tracking** và alerting
3. **Component inventory** management
4. **Cost tracking** cho repairs
5. **Integration** với asset management systems

### Software Proposals Module
1. **Budget management** và approval workflow
2. **License tracking** và renewal alerts  
3. **Usage analytics** sau khi cài đặt
4. **Bulk operations** cho multiple proposals
5. **Integration** với procurement systems

### Shared Features
1. **Real-time notifications** 
2. **Dashboard và reporting**
3. **Mobile app support**
4. **Advanced analytics**
5. **Integration APIs** cho external systems