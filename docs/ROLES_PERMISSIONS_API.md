# Roles & Permissions API Documentation

## 📚 Tổng quan

Module này quản lý **Vai trò (Roles)** và **Quyền (Permissions)** trong hệ thống Quản lý Tài sản Sửa chữa (Repair Asset Management System).

### Cấu trúc hệ thống:
- **Permissions**: Các quyền cụ thể (report_issues, manage_users, v.v.)
- **Roles**: Các vai trò (Giảng viên, Kỹ thuật viên, QTV Khoa, v.v.)
- **Role-Permission Relationship**: Quan hệ nhiều-nhiều giữa Roles và Permissions

---

## 🚀 Quick Start

### 1. Khởi động Backend
```bash
cd repair-asset-fit-be
npm install
npm run start:dev
```

### 2. Truy cập Swagger UI
Mở trình duyệt và truy cập:
```
http://localhost:3000/api-docs
```

### 3. Seed dữ liệu ban đầu
```bash
npm run seed:roles-permissions
```

---

## 📋 API Endpoints

### 🔐 Permissions API (`/api/v1/permissions`)

#### 1. **Create Permission** - Tạo quyền mới
- **Method**: `POST /api/v1/permissions`
- **Auth**: Required (JWT Token)
- **Body**:
```json
{
  "name": "Báo cáo sự cố",
  "code": "report_issues"
}
```
- **Response** (201):
```json
{
  "id": "uuid",
  "name": "Báo cáo sự cố",
  "code": "report_issues",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. **Bulk Create Permissions** - Tạo nhiều quyền cùng lúc
- **Method**: `POST /api/v1/permissions/bulk`
- **Auth**: Required
- **Body**:
```json
{
  "permissions": [
    {
      "name": "Báo cáo sự cố",
      "code": "report_issues"
    },
    {
      "name": "Theo dõi tiến độ xử lý",
      "code": "track_progress"
    },
    {
      "name": "Tra cứu thiết bị",
      "code": "search_equipment"
    }
  ]
}
```
- **Response** (201): Array of created permissions

#### 3. **Get All Permissions** - Lấy tất cả quyền
- **Method**: `GET /api/v1/permissions`
- **Auth**: Required
- **Response** (200):
```json
[
  {
    "id": "uuid",
    "name": "Báo cáo sự cố",
    "code": "report_issues",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  ...
]
```

#### 4. **Get Permission by ID** - Lấy quyền theo ID
- **Method**: `GET /api/v1/permissions/:id`
- **Auth**: Required
- **Response** (200): Permission object

#### 5. **Update Permission** - Cập nhật quyền
- **Method**: `PATCH /api/v1/permissions/:id`
- **Auth**: Required
- **Body**:
```json
{
  "name": "Báo cáo sự cố máy tính",
  "code": "report_computer_issues"
}
```
- **Response** (200): Updated permission

#### 6. **Delete Permission** - Xóa quyền (soft delete)
- **Method**: `DELETE /api/v1/permissions/:id`
- **Auth**: Required
- **Response** (204): No content

---

### 👥 Roles API (`/api/v1/roles`)

#### 1. **Create Role** - Tạo vai trò mới
- **Method**: `POST /api/v1/roles`
- **Auth**: Required
- **Body**:
```json
{
  "name": "Giảng viên",
  "code": "GIANG_VIEN",
  "permissionIds": []
}
```
- **Response** (201):
```json
{
  "id": "uuid",
  "name": "Giảng viên",
  "code": "GIANG_VIEN",
  "permissions": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### 2. **Bulk Create Roles** - Tạo nhiều vai trò cùng lúc
- **Method**: `POST /api/v1/roles/bulk`
- **Auth**: Required
- **Body**:
```json
{
  "roles": [
    {
      "name": "Giảng viên",
      "code": "GIANG_VIEN",
      "permissionIds": []
    },
    {
      "name": "Kỹ thuật viên",
      "code": "KY_THUAT_VIEN",
      "permissionIds": []
    },
    {
      "name": "Tổ trưởng Kỹ thuật",
      "code": "TO_TRUONG_KY_THUAT",
      "permissionIds": []
    }
  ]
}
```
- **Response** (201): Array of created roles

#### 3. **Assign Permissions to Role** - Gán quyền cho vai trò
- **Method**: `POST /api/v1/roles/assign-permissions`
- **Auth**: Required
- **Body**:
```json
{
  "roleId": "role-uuid-1",
  "permissionIds": [
    "perm-uuid-1",
    "perm-uuid-2",
    "perm-uuid-3",
    "perm-uuid-4"
  ]
}
```
- **Response** (200): Role with assigned permissions

#### 4. **Bulk Assign Permissions** - Gán quyền cho nhiều vai trò
- **Method**: `POST /api/v1/roles/bulk-assign-permissions`
- **Auth**: Required
- **Body**:
```json
{
  "assignments": [
    {
      "roleId": "role-uuid-1",
      "permissionIds": ["perm-uuid-1", "perm-uuid-2"]
    },
    {
      "roleId": "role-uuid-2",
      "permissionIds": ["perm-uuid-5", "perm-uuid-6"]
    }
  ]
}
```
- **Response** (200): Array of roles with assigned permissions

#### 5. **Get All Roles** - Lấy tất cả vai trò
- **Method**: `GET /api/v1/roles`
- **Auth**: Required
- **Response** (200):
```json
[
  {
    "id": "uuid",
    "name": "Giảng viên",
    "code": "GIANG_VIEN",
    "permissions": [
      {
        "id": "perm-uuid-1",
        "name": "Báo cáo sự cố",
        "code": "report_issues"
      },
      ...
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  },
  ...
]
```

#### 6. **Get Role by ID** - Lấy vai trò theo ID
- **Method**: `GET /api/v1/roles/:id`
- **Auth**: Required
- **Response** (200): Role object with permissions

#### 7. **Update Role** - Cập nhật vai trò
- **Method**: `PATCH /api/v1/roles/:id`
- **Auth**: Required
- **Body** (Example 1 - Update name only):
```json
{
  "name": "Kỹ thuật viên chính"
}
```
- **Body** (Example 2 - Update permissions only):
```json
{
  "permissionIds": ["perm-uuid-1", "perm-uuid-2", "perm-uuid-5"]
}
```
- **Body** (Example 3 - Update all):
```json
{
  "name": "Kỹ thuật viên cao cấp",
  "code": "KY_THUAT_VIEN_CAO_CAP",
  "permissionIds": ["perm-uuid-5", "perm-uuid-6", "perm-uuid-9"]
}
```
- **Response** (200): Updated role

#### 8. **Delete Role** - Xóa vai trò (soft delete)
- **Method**: `DELETE /api/v1/roles/:id`
- **Auth**: Required
- **Response** (204): No content

---

## 🎯 Workflow: Setup hệ thống từ đầu

### Bước 1: Tạo tất cả Permissions
**Endpoint**: `POST /api/v1/permissions/bulk`

**Request Body**:
```json
{
  "permissions": [
    { "name": "Báo cáo sự cố", "code": "report_issues" },
    { "name": "Theo dõi tiến độ xử lý", "code": "track_progress" },
    { "name": "Tra cứu thiết bị", "code": "search_equipment" },
    { "name": "Xem thông tin cá nhân", "code": "view_personal_info" },
    { "name": "Xử lý báo cáo sự cố", "code": "handle_reports" },
    { "name": "Tạo đề xuất thay thế", "code": "create_replacement_requests" },
    { "name": "Quản lý tài sản", "code": "manage_assets" },
    { "name": "Xem thống kê cá nhân", "code": "view_personal_stats" },
    { "name": "Quản lý kỹ thuật viên", "code": "manage_technicians" },
    { "name": "Phê duyệt đề xuất thay thế", "code": "approve_replacements" },
    { "name": "Lập tờ trình", "code": "create_proposals" },
    { "name": "Xác nhận biên bản", "code": "confirm_reports" },
    { "name": "Xử lý tờ trình", "code": "process_proposals" },
    { "name": "Xác minh thiết bị", "code": "verify_equipment" },
    { "name": "Lập biên bản", "code": "create_reports" },
    { "name": "Gửi đề xuất", "code": "submit_requests" },
    { "name": "Quản lý người dùng", "code": "manage_users" },
    { "name": "Phê duyệt cuối cùng", "code": "final_approval" },
    { "name": "Xem báo cáo thống kê", "code": "view_reports" },
    { "name": "Giám sát hệ thống", "code": "system_oversight" }
  ]
}
```

**Kết quả**: Tạo được 20 permissions, lưu lại các UUID

---

### Bước 2: Tạo tất cả Roles
**Endpoint**: `POST /api/v1/roles/bulk`

**Request Body**:
```json
{
  "roles": [
    { "name": "Giảng viên", "code": "GIANG_VIEN", "permissionIds": [] },
    { "name": "Kỹ thuật viên", "code": "KY_THUAT_VIEN", "permissionIds": [] },
    { "name": "Tổ trưởng Kỹ thuật", "code": "TO_TRUONG_KY_THUAT", "permissionIds": [] },
    { "name": "Nhân viên Phòng Quản trị", "code": "PHONG_QUAN_TRI", "permissionIds": [] },
    { "name": "Quản trị viên Khoa", "code": "QTV_KHOA", "permissionIds": [] }
  ]
}
```

**Kết quả**: Tạo được 5 roles, lưu lại các UUID

---

### Bước 3: Gán Permissions cho Roles
**Endpoint**: `POST /api/v1/roles/bulk-assign-permissions`

**Request Body** (thay thế các UUID thực tế):
```json
{
  "assignments": [
    {
      "roleId": "<GIANG_VIEN_UUID>",
      "permissionIds": [
        "<report_issues_UUID>",
        "<track_progress_UUID>",
        "<search_equipment_UUID>",
        "<view_personal_info_UUID>"
      ]
    },
    {
      "roleId": "<KY_THUAT_VIEN_UUID>",
      "permissionIds": [
        "<handle_reports_UUID>",
        "<create_replacement_requests_UUID>",
        "<manage_assets_UUID>",
        "<view_personal_stats_UUID>"
      ]
    },
    {
      "roleId": "<TO_TRUONG_KY_THUAT_UUID>",
      "permissionIds": [
        "<manage_technicians_UUID>",
        "<approve_replacements_UUID>",
        "<create_proposals_UUID>",
        "<confirm_reports_UUID>",
        "<handle_reports_UUID>",
        "<create_replacement_requests_UUID>"
      ]
    },
    {
      "roleId": "<PHONG_QUAN_TRI_UUID>",
      "permissionIds": [
        "<process_proposals_UUID>",
        "<verify_equipment_UUID>",
        "<create_reports_UUID>",
        "<submit_requests_UUID>"
      ]
    },
    {
      "roleId": "<QTV_KHOA_UUID>",
      "permissionIds": [
        "<manage_users_UUID>",
        "<final_approval_UUID>",
        "<view_reports_UUID>",
        "<system_oversight_UUID>"
      ]
    }
  ]
}
```

---

## 🎨 Sử dụng Swagger UI

### 1. Mở Swagger
```
http://localhost:3000/api-docs
```

### 2. Authorize (Nếu cần)
- Click nút **"Authorize"** ở góc trên bên phải
- Nhập JWT token: `Bearer <your-token>`
- Click **"Authorize"**

### 3. Thực hiện API Call
1. Chọn endpoint (ví dụ: `POST /api/v1/permissions/bulk`)
2. Click **"Try it out"**
3. Sửa Request Body theo ví dụ
4. Click **"Execute"**
5. Xem kết quả ở phần **Responses**

### 4. Tips
- Swagger đã có sẵn **Examples** cho mỗi endpoint
- Click vào dropdown "Example Value" để xem các ví dụ khác nhau
- Copy UUID từ response để dùng cho các request tiếp theo

---

## 📊 Data Structure - FE mockData

### Permissions (20 quyền)
| Code | Name | Role |
|------|------|------|
| `report_issues` | Báo cáo sự cố | Giảng viên |
| `track_progress` | Theo dõi tiến độ xử lý | Giảng viên |
| `search_equipment` | Tra cứu thiết bị | Giảng viên |
| `view_personal_info` | Xem thông tin cá nhân | Giảng viên |
| `handle_reports` | Xử lý báo cáo sự cố | Kỹ thuật viên, Tổ trưởng |
| `create_replacement_requests` | Tạo đề xuất thay thế | Kỹ thuật viên, Tổ trưởng |
| `manage_assets` | Quản lý tài sản | Kỹ thuật viên |
| `view_personal_stats` | Xem thống kê cá nhân | Kỹ thuật viên |
| `manage_technicians` | Quản lý kỹ thuật viên | Tổ trưởng |
| `approve_replacements` | Phê duyệt đề xuất thay thế | Tổ trưởng |
| `create_proposals` | Lập tờ trình | Tổ trưởng |
| `confirm_reports` | Xác nhận biên bản | Tổ trưởng |
| `process_proposals` | Xử lý tờ trình | Phòng Quản trị |
| `verify_equipment` | Xác minh thiết bị | Phòng Quản trị |
| `create_reports` | Lập biên bản | Phòng Quản trị |
| `submit_requests` | Gửi đề xuất | Phòng Quản trị |
| `manage_users` | Quản lý người dùng | QTV Khoa |
| `final_approval` | Phê duyệt cuối cùng | QTV Khoa |
| `view_reports` | Xem báo cáo thống kê | QTV Khoa |
| `system_oversight` | Giám sát hệ thống | QTV Khoa |

### Roles (5 vai trò)
| Code | Name | Số lượng Permissions |
|------|------|---------------------|
| `GIANG_VIEN` | Giảng viên | 4 |
| `KY_THUAT_VIEN` | Kỹ thuật viên | 4 |
| `TO_TRUONG_KY_THUAT` | Tổ trưởng Kỹ thuật | 6 |
| `PHONG_QUAN_TRI` | Nhân viên Phòng Quản trị | 4 |
| `QTV_KHOA` | Quản trị viên Khoa | 4 |

---

## 🔧 Validation Rules

### Permission
- **name**: Required, string, max 255 characters
- **code**: Required, unique, snake_case (lowercase + underscores), max 100 characters

### Role
- **name**: Required, string, max 255 characters
- **code**: Optional (auto-generated if not provided), unique, UPPER_SNAKE_CASE, max 100 characters
- **permissionIds**: Optional, array of valid UUIDs

---

## ⚠️ Error Handling

### Common Error Responses

**400 Bad Request** - Invalid data
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "Code must be lowercase letters and underscores only (snake_case)"
  ]
}
```

**404 Not Found** - Resource not found
```json
{
  "statusCode": 404,
  "message": "Permission with ID xxx not found"
}
```

**409 Conflict** - Duplicate code
```json
{
  "statusCode": 409,
  "message": "Permission with code 'report_issues' already exists"
}
```

**401 Unauthorized** - Missing or invalid token
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

---

## 📝 Notes

1. **Soft Delete**: Xóa không xóa vật lý khỏi database, chỉ set `deletedAt` timestamp
2. **Code Format**:
   - Permission code: `snake_case` (lowercase + underscores)
   - Role code: `UPPER_SNAKE_CASE` (uppercase + underscores)
3. **Auto-generate Code**: Nếu không cung cấp code khi tạo Role, hệ thống sẽ tự sinh từ name
4. **Permissions Assignment**: Khi gán permissions cho role, danh sách mới sẽ **thay thế hoàn toàn** danh sách cũ

---

## 🚀 Chạy Seed Script

Thay vì gọi API thủ công, bạn có thể sử dụng seed script:

```bash
# Chạy script seed
npm run seed:roles-permissions

# Hoặc
ts-node src/seeds/seed-roles-permissions.ts
```

Script sẽ tự động:
1. Tạo 20 permissions
2. Tạo 5 roles
3. Gán permissions cho từng role
4. Skip nếu dữ liệu đã tồn tại

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:
1. Database có đang chạy không: `docker ps`
2. Migrations đã chạy chưa: `npm run migration:run`
3. Check logs: `docker-compose logs -f`
4. Verify JWT token còn valid không

---

**Tài liệu này được tạo tự động từ FE mockData và BE DTOs**
