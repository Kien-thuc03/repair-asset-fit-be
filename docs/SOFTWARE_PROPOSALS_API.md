# Software Proposals API Documentation

## Tổng quan

Module **Software Proposals** quản lý việc đề xuất mua/trang bị phần mềm cho các phòng máy tính trong hệ thống. Module này cho phép:

- Tạo đề xuất phần mềm với nhiều phần mềm cùng lúc
- Quản lý quy trình duyệt đề xuất (CHỜ_DUYỆT → ĐÃ_DUYỆT → ĐÃ_TRANG_BỊ)
- Theo dõi trạng thái và lịch sử đề xuất
- Phân quyền truy cập và chỉnh sửa

## Cấu trúc Database

### Bảng `software_proposals`

- **id**: UUID - Khóa chính
- **proposalCode**: string - Mã đề xuất (DXPM-YYYY-NNNN)
- **proposerId**: UUID - ID người tạo đề xuất
- **approverId**: UUID - ID người duyệt (nullable)
- **roomId**: UUID - ID phòng cần trang bị
- **reason**: text - Lý do đề xuất
- **status**: enum - Trạng thái đề xuất
- **createdAt/updatedAt**: timestamp

### Bảng `software_proposal_items`

- **id**: UUID - Khóa chính
- **proposalId**: UUID - ID đề xuất
- **softwareName**: string - Tên phần mềm
- **version**: string - Phiên bản (nullable)
- **publisher**: string - Nhà sản xuất (nullable)
- **quantity**: int - Số lượng license
- **licenseType**: string - Loại giấy phép (nullable)
- **newlyAcquiredSoftwareId**: UUID - ID phần mềm sau khi thêm vào hệ thống (nullable)

### Enum `SoftwareProposalStatus`

- **CHỜ_DUYỆT**: Đề xuất mới tạo, chờ xét duyệt
- **ĐÃ_DUYỆT**: Đã được duyệt, có thể tiến hành mua
- **ĐÃ_TỪ_CHỐI**: Bị từ chối, có thể chỉnh sửa và gửi lại
- **ĐÃ_TRANG_BỊ**: Đã hoàn thành mua và cài đặt

## API Endpoints

### 1. Tạo đề xuất phần mềm mới

**POST** `/api/v1/software-proposals`

**Headers:**

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body:**

```json
{
  "roomId": "87ccafb9-9a2d-491a-9b54-7281a2c196cc",
  "reason": "Phòng máy tính cần Microsoft Office để phục vụ giảng dạy môn Tin học văn phòng cho sinh viên năm nhất",
  "items": [
    {
      "softwareName": "Microsoft Office 2021 Professional Plus",
      "version": "2021",
      "publisher": "Microsoft Corporation",
      "quantity": 30,
      "licenseType": "Vĩnh viễn"
    },
    {
      "softwareName": "Adobe Photoshop",
      "version": "2024",
      "publisher": "Adobe Inc.",
      "quantity": 25,
      "licenseType": "Theo năm"
    }
  ]
}
```

**Response:**

```json
{
  "id": "123e4567-e89b-12d3-a456-426614174000",
  "proposalCode": "DXPM-2025-0001",
  "proposerId": "c6660b91-ef5e-4726-b003-b4f7980a8e90",
  "roomId": "87ccafb9-9a2d-491a-9b54-7281a2c196cc",
  "reason": "Phòng máy tính cần Microsoft Office để phục vụ giảng dạy...",
  "status": "CHỜ_DUYỆT",
  "createdAt": "2025-01-15T10:30:00Z",
  "updatedAt": "2025-01-15T10:30:00Z",
  "proposer": {
    "id": "c6660b91-ef5e-4726-b003-b4f7980a8e90",
    "fullName": "Nguyễn Xuân Hồng",
    "email": "nguyenxuanhong@iuh.edu.vn",
    "unitName": "Khoa Công nghệ thông tin"
  },
  "room": {
    "id": "87ccafb9-9a2d-491a-9b54-7281a2c196cc",
    "name": "A01.01",
    "building": "A",
    "floor": "1",
    "roomNumber": "01"
  },
  "items": [
    {
      "id": "item-1-id",
      "softwareName": "Microsoft Office 2021 Professional Plus",
      "version": "2021",
      "publisher": "Microsoft Corporation",
      "quantity": 30,
      "licenseType": "Vĩnh viễn"
    },
    {
      "id": "item-2-id",
      "softwareName": "Adobe Photoshop",
      "version": "2024",
      "publisher": "Adobe Inc.",
      "quantity": 25,
      "licenseType": "Theo năm"
    }
  ]
}
```

### 2. Lấy danh sách đề xuất

**GET** `/api/v1/software-proposals`

**Query Parameters:**

- `roomId`: Lọc theo ID phòng
- `proposerId`: Lọc theo ID người tạo
- `status`: Lọc theo trạng thái
- `search`: Tìm kiếm theo mã hoặc lý do
- `fromDate/toDate`: Lọc theo khoảng thời gian
- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng/trang (mặc định: 10)
- `sortBy`: Trường sắp xếp (mặc định: createdAt)
- `sortOrder`: Thứ tự sắp xếp (mặc định: DESC)

**Example:**

```
GET /api/v1/software-proposals?status=CHỜ_DUYỆT&page=1&limit=10
```

### 3. Lấy chi tiết đề xuất

**GET** `/api/v1/software-proposals/:id`

### 4. Cập nhật đề xuất

**PUT** `/api/v1/software-proposals/:id`

**Quyền hạn:** Chỉ người tạo hoặc admin

**Body:**

```json
{
  "roomId": "new-room-id",
  "reason": "Lý do đã được cập nhật",
  "status": "ĐÃ_DUYỆT"
}
```

### 5. Duyệt đề xuất

**PUT** `/api/v1/software-proposals/:id/approve`

**Quyền hạn:** Admin/Manager

### 6. Từ chối đề xuất

**PUT** `/api/v1/software-proposals/:id/reject`

**Quyền hạn:** Admin/Manager

### 7. Đánh dấu đã trang bị

**PUT** `/api/v1/software-proposals/:id/mark-equipped`

**Điều kiện:** Đề xuất phải đang ở trạng thái ĐÃ_DUYỆT

### 8. Xóa đề xuất

**DELETE** `/api/v1/software-proposals/:id`

**Quyền hạn:** Chỉ người tạo hoặc admin
**Điều kiện:** Chỉ xóa được khi CHỜ_DUYỆT hoặc ĐÃ_TỪ_CHỐI

## Quy trình nghiệp vụ

### 1. Tạo đề xuất mới

1. Người dùng (giảng viên/kỹ thuật viên) tạo đề xuất cho phòng máy
2. Có thể đề xuất nhiều phần mềm khác nhau cùng lúc
3. Hệ thống tự động sinh mã đề xuất (DXPM-2025-NNNN)
4. Trạng thái ban đầu: CHỜ_DUYỆT

### 2. Duyệt đề xuất

1. Admin/Manager xem xét đề xuất
2. Có thể duyệt (ĐÃ_DUYỆT) hoặc từ chối (ĐÃ_TỪ_CHỐI)
3. Ghi nhận người duyệt và thời gian duyệt

### 3. Thực hiện đề xuất

1. Sau khi được duyệt, tiến hành mua phần mềm
2. Cài đặt phần mềm lên các máy tính trong phòng
3. Đánh dấu "đã trang bị" (ĐÃ_TRANG_BỊ)

### 4. Quản lý và theo dõi

1. Theo dõi tình trạng các đề xuất
2. Thống kê báo cáo theo thời gian, phòng, loại phần mềm
3. Lịch sử các đề xuất đã thực hiện

## Validation Rules

### CreateSoftwareProposalDto

- **roomId**: Bắt buộc, phải là UUID hợp lệ
- **reason**: Bắt buộc, tối đa 1000 ký tự
- **items**: Bắt buộc, ít nhất 1 item

### CreateSoftwareProposalItemDto

- **softwareName**: Bắt buộc, tối đa 255 ký tự
- **version**: Tùy chọn, tối đa 100 ký tự
- **publisher**: Tùy chọn, tối đa 255 ký tự
- **quantity**: Bắt buộc, ít nhất 1
- **licenseType**: Tùy chọn, tối đa 100 ký tự

## Error Handling

### 400 Bad Request

- Dữ liệu validation không hợp lệ
- Phòng đã bị xóa
- Trạng thái không phù hợp cho thao tác

### 403 Forbidden

- Không có quyền thực hiện thao tác
- Không phải người tạo đề xuất

### 404 Not Found

- Không tìm thấy đề xuất
- Không tìm thấy phòng

### 409 Conflict

- Trùng lặp dữ liệu

## Security

### Authentication

- Tất cả endpoints đều yêu cầu JWT token
- Header: `Authorization: Bearer <token>`

### Authorization

- **Tạo đề xuất**: Tất cả user đã đăng nhập
- **Xem danh sách**: Tất cả user đã đăng nhập
- **Cập nhật**: Chỉ người tạo hoặc admin
- **Duyệt/Từ chối**: Admin/Manager
- **Xóa**: Chỉ người tạo hoặc admin

### Data Protection

- Validation nghiêm ngặt tất cả input
- SQL injection protection qua TypeORM
- Rate limiting qua ThrottlerModule

## Testing

### Unit Tests

```bash
npm run test -- software-proposals
```

### E2E Tests

```bash
npm run test:e2e -- software-proposals
```

### Manual Testing với Swagger

1. Khởi động server: `npm run start:dev`
2. Truy cập: `http://localhost:3000/api/docs`
3. Tìm section "Software Proposals"
4. Test từng endpoint với dữ liệu mẫu

## Performance Considerations

### Database Indexing

- Index trên `proposalCode` để tìm kiếm nhanh
- Index trên `roomId`, `proposerId`, `status` để filter
- Index trên `createdAt` để sắp xếp

### Query Optimization

- Sử dụng eager loading cho relations cần thiết
- Pagination để giới hạn số lượng records
- Query builder cho complex filters

### Caching

- Cache danh sách enum status
- Cache thông tin phòng và user thường xuyên sử dụng

## Future Enhancements

1. **Notifications**: Thông báo khi đề xuất được duyệt/từ chối
2. **Workflow**: Quy trình duyệt nhiều cấp
3. **Budget Management**: Quản lý ngân sách cho đề xuất
4. **Integration**: Tích hợp với hệ thống mua sắm
5. **Reporting**: Báo cáo thống kê chi tiết
6. **Approval Templates**: Mẫu đề xuất cho các loại phần mềm phổ biến
