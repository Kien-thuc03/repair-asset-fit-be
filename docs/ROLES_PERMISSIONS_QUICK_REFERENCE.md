# 🎯 Quick Reference - Roles & Permissions API

## 📦 Payloads mẫu cho Swagger Testing

### 1️⃣ CREATE ALL PERMISSIONS (Bulk)
**Endpoint**: `POST /api/v1/permissions/bulk`

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

---

### 2️⃣ CREATE ALL ROLES (Bulk)
**Endpoint**: `POST /api/v1/roles/bulk`

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

---

### 3️⃣ ASSIGN PERMISSIONS (Template)
**Endpoint**: `POST /api/v1/roles/bulk-assign-permissions`

⚠️ **LƯU Ý**: Thay thế `<ROLE_UUID>` và `<PERM_UUID>` bằng UUID thực tế từ database!

**Cách lấy UUID**:
1. Gọi `GET /api/v1/permissions` → Copy ID của permissions
2. Gọi `GET /api/v1/roles` → Copy ID của roles
3. Thay thế vào template dưới

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

## 🔥 Quick Setup Steps

### Cách 1: Dùng Seed Script (Recommended)
```bash
npm run seed:roles-permissions
```
✅ Tự động tạo tất cả permissions, roles và relationships!

---

### Cách 2: Thủ công qua Swagger

#### Step 1: Create Permissions
1. Mở Swagger: `http://localhost:3000/api-docs`
2. Tìm `POST /api/v1/permissions/bulk`
3. Click "Try it out"
4. Copy payload từ **1️⃣** ở trên
5. Execute
6. ✅ Tạo được 20 permissions

#### Step 2: Create Roles
1. Tìm `POST /api/v1/roles/bulk`
2. Click "Try it out"
3. Copy payload từ **2️⃣** ở trên
4. Execute
5. ✅ Tạo được 5 roles

#### Step 3: Get UUIDs
1. Gọi `GET /api/v1/permissions` → Save response
2. Gọi `GET /api/v1/roles` → Save response
3. Build mapping:
```
report_issues → uuid-xxx-1
track_progress → uuid-xxx-2
...
GIANG_VIEN → uuid-yyy-1
KY_THUAT_VIEN → uuid-yyy-2
...
```

#### Step 4: Assign Permissions to Roles
1. Tìm `POST /api/v1/roles/bulk-assign-permissions`
2. Copy payload từ **3️⃣** ở trên
3. **Thay thế TẤT CẢ placeholders** bằng UUID thực
4. Execute
5. ✅ Hoàn tất!

---

## 📋 Permission-Role Mapping (Reference)

### 👨‍🏫 Giảng viên (GIANG_VIEN)
- report_issues
- track_progress
- search_equipment
- view_personal_info

### 🔧 Kỹ thuật viên (KY_THUAT_VIEN)
- handle_reports
- create_replacement_requests
- manage_assets
- view_personal_stats

### 👔 Tổ trưởng Kỹ thuật (TO_TRUONG_KY_THUAT)
- manage_technicians
- approve_replacements
- create_proposals
- confirm_reports
- handle_reports *(inherited)*
- create_replacement_requests *(inherited)*

### 🏢 Phòng Quản trị (PHONG_QUAN_TRI)
- process_proposals
- verify_equipment
- create_reports
- submit_requests

### 👑 QTV Khoa (QTV_KHOA)
- manage_users
- final_approval
- view_reports
- system_oversight

---

## 🛠️ Helper SQL Queries

### Get Permission IDs by Code
```sql
SELECT id, code, name FROM permissions 
WHERE code IN (
  'report_issues', 'track_progress', 'search_equipment', 
  'view_personal_info', 'handle_reports'
)
ORDER BY code;
```

### Get Role IDs by Code
```sql
SELECT id, code, name FROM roles 
WHERE code IN (
  'GIANG_VIEN', 'KY_THUAT_VIEN', 'TO_TRUONG_KY_THUAT',
  'PHONG_QUAN_TRI', 'QTV_KHOA'
)
ORDER BY code;
```

### Check Role-Permission Assignments
```sql
SELECT 
  r.code as role_code,
  r.name as role_name,
  p.code as permission_code,
  p.name as permission_name
FROM role_permissions rp
JOIN roles r ON r.id = rp."roleId"
JOIN permissions p ON p.id = rp."permissionId"
ORDER BY r.code, p.code;
```

### Count Permissions per Role
```sql
SELECT 
  r.code,
  r.name,
  COUNT(rp."permissionId") as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON rp."roleId" = r.id
GROUP BY r.id, r.code, r.name
ORDER BY r.code;
```

---

## ⚡ Testing Tips

### 1. Verify Setup
```bash
# Check all permissions
curl http://localhost:3000/api/v1/permissions

# Check all roles with permissions
curl http://localhost:3000/api/v1/roles
```

### 2. Test Single Create
```json
// POST /api/v1/permissions
{
  "name": "Test Permission",
  "code": "test_permission"
}
```

### 3. Test Single Role with Permissions
```json
// POST /api/v1/roles
{
  "name": "Test Role",
  "code": "TEST_ROLE",
  "permissionIds": ["<perm-uuid-1>", "<perm-uuid-2>"]
}
```

### 4. Update Role Permissions
```json
// PATCH /api/v1/roles/:id
{
  "permissionIds": ["<new-perm-uuid-1>", "<new-perm-uuid-2>"]
}
```

---

## 🐛 Troubleshooting

### ❌ Error: "Permission with code 'xxx' already exists"
**Solution**: Permissions đã được tạo rồi. Dùng `GET /api/v1/permissions` để xem danh sách.

### ❌ Error: "Permissions not found"
**Solution**: UUID không đúng. Kiểm tra lại UUID từ `GET /api/v1/permissions`.

### ❌ Error: "Code must be lowercase"
**Solution**: Permission code phải là `snake_case` (lowercase + underscores).

### ❌ Error: "Code must be uppercase"
**Solution**: Role code phải là `UPPER_SNAKE_CASE` (uppercase + underscores).

### ❌ Database connection error
```bash
# Check containers
docker ps

# Restart database
docker-compose restart db

# Check logs
docker-compose logs -f db
```

---

## 📞 Quick Links

- **Swagger UI**: http://localhost:3000/api-docs
- **Full Documentation**: [ROLES_PERMISSIONS_API.md](./ROLES_PERMISSIONS_API.md)
- **Seed Script**: `src/seeds/seed-roles-permissions.ts`

---

**Copy-paste friendly payloads for fast testing! 🚀**
