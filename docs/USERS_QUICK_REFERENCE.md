# Users API - Quick Reference

## 📋 Endpoints Overview

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/users` | Lấy danh sách users | ✓ |
| GET | `/users/:id` | Lấy thông tin user | ✓ |
| POST | `/users` | Tạo user mới | ✓ |
| PUT | `/users/:id` | Cập nhật user | ✓ |
| DELETE | `/users/:id` | Xóa user | ✓ |

---

## 🔍 GET /users - List Users

**Query Parameters:**
```
?search=keyword           # Tìm trong username/fullName/email
&status=ACTIVE            # ACTIVE|INACTIVE|LOCKED|DELETED
&unitId=uuid             # Filter by unit
&roleId=uuid             # Filter by role
&page=1                  # Page number (default: 1)
&limit=10                # Items per page (1-100, default: 10)
&sortBy=createdAt        # fullName|email|createdAt|updatedAt
&sortOrder=DESC          # ASC|DESC
```

**Example:**
```bash
GET /api/users?search=admin&status=ACTIVE&page=1&limit=20&sortBy=fullName&sortOrder=ASC
```

**Response:**
```json
{
  "data": [UserResponseDto],
  "total": 100,
  "page": 1,
  "limit": 20,
  "totalPages": 5
}
```

---

## 🔎 GET /users/:id - Get User

**Example:**
```bash
GET /api/users/a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11
```

**Response:** `UserResponseDto`

---

## ➕ POST /users - Create User

**Required Fields:**
- `username` (3-50 chars, alphanumeric + underscore)
- `password` (≥6 chars, must have: uppercase, lowercase, digit, special char)
- `fullName` (max 100 chars)
- `email` (valid email format)

**Optional Fields:**
- `unitId` (UUID)
- `phoneNumber` (Vietnam format)
- `birthDate` (YYYY-MM-DD)
- `status` (default: ACTIVE)
- `roleIds` (array of UUIDs)

**Example:**
```bash
POST /api/users
Content-Type: application/json

{
  "username": "john_doe",
  "password": "Pass@123",
  "fullName": "John Doe",
  "email": "john@example.com",
  "phoneNumber": "0909123456",
  "roleIds": ["uuid-1", "uuid-2"]
}
```

**Response:** `UserResponseDto` (Status 201)

---

## ✏️ PUT /users/:id - Update User

**All fields optional:**
```bash
PUT /api/users/uuid-here
Content-Type: application/json

{
  "fullName": "Updated Name",
  "status": "INACTIVE",
  "password": "NewPass@123"
}
```

**Response:** `UserResponseDto`

---

## 🗑️ DELETE /users/:id - Delete User

**Soft Delete (default):**
```bash
DELETE /api/users/uuid-here
# or
DELETE /api/users/uuid-here?hard=false
```

**Hard Delete:**
```bash
DELETE /api/users/uuid-here?hard=true
```

**Response:**
```json
{
  "message": "Xóa người dùng thành công"
}
```

---

## 📦 UserResponseDto

```typescript
{
  id: string;              // UUID
  username: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  birthDate?: string;      // YYYY-MM-DD
  status: UserStatus;      // ACTIVE|INACTIVE|LOCKED|DELETED
  roles?: [{
    id: string;
    name: string;
    code: string;
  }];
}
```

**Note:** `password` field is NEVER returned

---

## ✅ Validation Rules

### Username
- ✓ 3-50 characters
- ✓ Only letters, numbers, underscore
- ✓ Must be unique
- ✗ No spaces or special chars

### Password
- ✓ Minimum 6 characters
- ✓ At least 1 uppercase letter
- ✓ At least 1 lowercase letter
- ✓ At least 1 digit
- ✓ At least 1 special character (@$!%*?&)

### Email
- ✓ Valid email format
- ✓ Must be unique

### Phone Number
- ✓ Vietnam format
- ✓ Starts with +84 or 0
- ✓ 9-10 digits after prefix

### Birth Date
- ✓ Format: YYYY-MM-DD
- ✓ ISO 8601 date string

---

## ⚠️ Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation error message in Vietnamese",
  "error": "Bad Request"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Không tìm thấy người dùng với ID: xxx",
  "error": "Not Found"
}
```

### 409 Conflict
```json
{
  "statusCode": 409,
  "message": "Tên đăng nhập đã tồn tại",
  "error": "Conflict"
}
```

---

## 🔐 Security

- ✓ Passwords hashed with bcrypt (salt rounds: 10)
- ✓ Password never returned in responses
- ✓ All inputs validated and sanitized
- ✓ UUID validation on all IDs
- ✓ Soft delete by default (data preservation)

---

## 🧪 Quick Test Commands

### List all active users
```bash
curl http://localhost:3000/api/users?status=ACTIVE
```

### Search users
```bash
curl http://localhost:3000/api/users?search=admin
```

### Get specific user
```bash
curl http://localhost:3000/api/users/{uuid}
```

### Create user
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "Test@123",
    "fullName": "Test User",
    "email": "test@example.com"
  }'
```

### Update user
```bash
curl -X PUT http://localhost:3000/api/users/{uuid} \
  -H "Content-Type: application/json" \
  -d '{"status": "INACTIVE"}'
```

### Delete user (soft)
```bash
curl -X DELETE http://localhost:3000/api/users/{uuid}
```

### Delete user (hard)
```bash
curl -X DELETE "http://localhost:3000/api/users/{uuid}?hard=true"
```

---

## 📚 Related Documentation

- **Full API Docs:** `docs/USERS_API.md`
- **Module README:** `src/modules/users/README.md`
- **Update Summary:** `docs/USERS_MODULE_UPDATE.md`
- **Testing Checklist:** `docs/USERS_TESTING_CHECKLIST.md`
- **Swagger UI:** `http://localhost:3000/api/docs`

---

## 🎯 Common Use Cases

### Create Admin User
```json
POST /api/users
{
  "username": "admin",
  "password": "Admin@123",
  "fullName": "System Administrator",
  "email": "admin@company.com",
  "roleIds": ["admin-role-uuid"],
  "status": "ACTIVE"
}
```

### Create Technician
```json
POST /api/users
{
  "username": "tech01",
  "password": "Tech@123",
  "fullName": "Technician 01",
  "email": "tech01@company.com",
  "roleIds": ["technician-role-uuid"],
  "unitId": "it-department-uuid"
}
```

### Deactivate User
```json
PUT /api/users/{uuid}
{
  "status": "INACTIVE"
}
```

### Search by Email Domain
```bash
GET /api/users?search=@company.com
```

### Get All Inactive Users
```bash
GET /api/users?status=INACTIVE&sortBy=updatedAt&sortOrder=DESC
```

---

## 💡 Tips

1. **Always use UUID v4** for all IDs
2. **Default pagination** is 10 items per page
3. **Maximum limit** is 100 items per page
4. **Soft delete** preserves audit trail
5. **Search is case-insensitive** and uses ILIKE
6. **Roles are loaded automatically** with user data
7. **Password changes** require full new password (no partial updates)
8. **Unique constraints** on username and email
9. **All error messages** are in Vietnamese
10. **Use Swagger UI** for interactive testing

---

**Version:** 1.0.0  
**Last Updated:** October 19, 2025
