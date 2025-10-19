# User Management API Documentation

## Tổng quan
Module quản lý người dùng cung cấp các API để tạo, đọc, cập nhật và xóa thông tin người dùng trong hệ thống.

## Base URL
```
/api/users
```

## Endpoints

### 1. Lấy danh sách người dùng
**GET** `/users`

Lấy danh sách tất cả người dùng với phân trang và bộ lọc.

**Query Parameters:**
| Tham số | Kiểu | Mô tả | Mặc định | Bắt buộc |
|---------|------|-------|----------|----------|
| search | string | Tìm kiếm theo username, họ tên hoặc email | - | Không |
| status | UserStatus | Lọc theo trạng thái (ACTIVE, INACTIVE, LOCKED, DELETED) | - | Không |
| unitId | uuid | Lọc theo ID đơn vị | - | Không |
| roleId | uuid | Lọc theo ID vai trò | - | Không |
| page | number | Số trang | 1 | Không |
| limit | number | Số bản ghi/trang (1-100) | 10 | Không |
| sortBy | string | Sắp xếp theo trường (fullName, email, createdAt, updatedAt) | createdAt | Không |
| sortOrder | string | Thứ tự sắp xếp (ASC, DESC) | DESC | Không |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "username": "john_doe",
      "fullName": "Nguyễn Văn A",
      "email": "john.doe@example.com",
      "phoneNumber": "+84901234567",
      "birthDate": "1990-01-01",
      "status": "ACTIVE",
      "roles": [
        {
          "id": "uuid",
          "name": "Admin",
          "code": "ADMIN"
        }
      ]
    }
  ],
  "total": 100,
  "page": 1,
  "limit": 10,
  "totalPages": 10
}
```

**Status Codes:**
- `200 OK` - Thành công
- `400 Bad Request` - Tham số không hợp lệ

---

### 2. Lấy thông tin người dùng theo ID
**GET** `/users/:id`

Lấy thông tin chi tiết của một người dùng.

**URL Parameters:**
| Tham số | Kiểu | Mô tả | Bắt buộc |
|---------|------|-------|----------|
| id | uuid | ID người dùng | Có |

**Response:**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "fullName": "Nguyễn Văn A",
  "email": "john.doe@example.com",
  "phoneNumber": "+84901234567",
  "birthDate": "1990-01-01",
  "status": "ACTIVE",
  "roles": [
    {
      "id": "uuid",
      "name": "Admin",
      "code": "ADMIN"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Thành công
- `400 Bad Request` - ID không hợp lệ
- `404 Not Found` - Không tìm thấy người dùng

---

### 3. Tạo người dùng mới
**POST** `/users`

Tạo một người dùng mới trong hệ thống.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "Password@123",
  "fullName": "Nguyễn Văn A",
  "email": "john.doe@example.com",
  "unitId": "uuid",
  "phoneNumber": "+84901234567",
  "birthDate": "1990-01-01",
  "status": "ACTIVE",
  "roleIds": ["uuid-role-1", "uuid-role-2"]
}
```

**Validation Rules:**
- `username`: Bắt buộc, 3-50 ký tự, chỉ chứa chữ, số và dấu gạch dưới
- `password`: Bắt buộc, tối thiểu 6 ký tự, phải có chữ hoa, chữ thường, số và ký tự đặc biệt
- `fullName`: Bắt buộc, tối đa 100 ký tự
- `email`: Bắt buộc, định dạng email hợp lệ
- `phoneNumber`: Tùy chọn, định dạng số điện thoại Việt Nam (+84 hoặc 0)
- `birthDate`: Tùy chọn, định dạng YYYY-MM-DD
- `status`: Tùy chọn, mặc định ACTIVE
- `roleIds`: Tùy chọn, mảng UUID

**Response:**
```json
{
  "id": "uuid",
  "username": "john_doe",
  "fullName": "Nguyễn Văn A",
  "email": "john.doe@example.com",
  "phoneNumber": "+84901234567",
  "birthDate": "1990-01-01",
  "status": "ACTIVE",
  "roles": [
    {
      "id": "uuid",
      "name": "Admin",
      "code": "ADMIN"
    }
  ]
}
```

**Status Codes:**
- `201 Created` - Tạo thành công
- `400 Bad Request` - Dữ liệu không hợp lệ
- `409 Conflict` - Username hoặc email đã tồn tại

---

### 4. Cập nhật thông tin người dùng
**PUT** `/users/:id`

Cập nhật thông tin của người dùng. Chỉ cần gửi các trường cần cập nhật.

**URL Parameters:**
| Tham số | Kiểu | Mô tả | Bắt buộc |
|---------|------|-------|----------|
| id | uuid | ID người dùng | Có |

**Request Body:** (tất cả các trường đều tùy chọn)
```json
{
  "username": "john_doe_updated",
  "password": "NewPassword@123",
  "fullName": "Nguyễn Văn A - Updated",
  "email": "new.email@example.com",
  "unitId": "uuid",
  "phoneNumber": "+84901234568",
  "birthDate": "1990-01-02",
  "status": "INACTIVE",
  "roleIds": ["uuid-role-3"]
}
```

**Response:**
```json
{
  "id": "uuid",
  "username": "john_doe_updated",
  "fullName": "Nguyễn Văn A - Updated",
  "email": "new.email@example.com",
  "phoneNumber": "+84901234568",
  "birthDate": "1990-01-02",
  "status": "INACTIVE",
  "roles": [
    {
      "id": "uuid",
      "name": "User",
      "code": "USER"
    }
  ]
}
```

**Status Codes:**
- `200 OK` - Cập nhật thành công
- `400 Bad Request` - Dữ liệu không hợp lệ
- `404 Not Found` - Không tìm thấy người dùng
- `409 Conflict` - Username hoặc email đã tồn tại

---

### 5. Xóa người dùng
**DELETE** `/users/:id`

Xóa người dùng khỏi hệ thống. Hỗ trợ cả soft delete và hard delete.

**URL Parameters:**
| Tham số | Kiểu | Mô tả | Bắt buộc |
|---------|------|-------|----------|
| id | uuid | ID người dùng | Có |

**Query Parameters:**
| Tham số | Kiểu | Mô tả | Mặc định | Bắt buộc |
|---------|------|-------|----------|----------|
| hard | boolean | true = xóa vĩnh viễn, false = xóa mềm | false | Không |

**Response:**
```json
{
  "message": "Xóa người dùng thành công"
}
```

**Status Codes:**
- `200 OK` - Xóa thành công
- `400 Bad Request` - ID không hợp lệ
- `404 Not Found` - Không tìm thấy người dùng

---

## Enums

### UserStatus
```typescript
enum UserStatus {
  ACTIVE = 'ACTIVE',      // Đang hoạt động
  INACTIVE = 'INACTIVE',  // Không hoạt động
  LOCKED = 'LOCKED',      // Bị khóa
  DELETED = 'DELETED'     // Đã xóa
}
```

---

## Error Responses

Tất cả các lỗi đều trả về theo format:

```json
{
  "statusCode": 400,
  "message": "Thông báo lỗi chi tiết",
  "error": "Bad Request"
}
```

---

## Examples

### Ví dụ 1: Tìm kiếm người dùng theo tên
```bash
GET /api/users?search=nguyen&page=1&limit=20
```

### Ví dụ 2: Lọc người dùng theo trạng thái và đơn vị
```bash
GET /api/users?status=ACTIVE&unitId=uuid-123&sortBy=fullName&sortOrder=ASC
```

### Ví dụ 3: Tạo người dùng mới với vai trò
```bash
POST /api/users
Content-Type: application/json

{
  "username": "technician01",
  "password": "Tech@2024",
  "fullName": "Trần Văn B",
  "email": "technician01@example.com",
  "phoneNumber": "0909123456",
  "roleIds": ["uuid-technician-role"]
}
```

### Ví dụ 4: Cập nhật trạng thái người dùng
```bash
PUT /api/users/uuid-123
Content-Type: application/json

{
  "status": "INACTIVE"
}
```

### Ví dụ 5: Xóa mềm người dùng
```bash
DELETE /api/users/uuid-123?hard=false
```

### Ví dụ 6: Xóa vĩnh viễn người dùng
```bash
DELETE /api/users/uuid-123?hard=true
```

---

## Notes

1. **Bảo mật mật khẩu**: Mật khẩu được hash tự động bằng bcrypt trước khi lưu vào database
2. **Soft Delete**: Mặc định sử dụng soft delete để bảo toàn dữ liệu lịch sử
3. **Validation**: Tất cả input đều được validate nghiêm ngặt với thông báo lỗi tiếng Việt
4. **Phân trang**: Giới hạn tối đa 100 bản ghi/trang để tối ưu hiệu năng
5. **Relations**: API tự động load thông tin roles và unit khi trả về dữ liệu
6. **UUID**: Tất cả ID đều sử dụng UUID v4 để đảm bảo tính duy nhất

---

## Testing với Swagger

Sau khi khởi động ứng dụng, truy cập Swagger UI tại:
```
http://localhost:3000/api/docs
```

Tại đây bạn có thể:
- Xem chi tiết từng endpoint
- Test API trực tiếp từ trình duyệt
- Xem request/response schema
- Xem validation rules

---

**Last Updated:** October 19, 2025
