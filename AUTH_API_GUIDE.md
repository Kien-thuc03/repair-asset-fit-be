# 🔐 API Đăng Nhập - Repair Asset FIT System

## 📋 Mục lục
- [Tổng quan](#tổng-quan)
- [Thay đổi Backend](#thay-đổi-backend)
- [Thay đổi Frontend](#thay-đổi-frontend)
- [Cách sử dụng](#cách-sử-dụng)
- [API Documentation](#api-documentation)
- [Testing](#testing)

---

## 🎯 Tổng quan

Hệ thống xác thực đã được cập nhật để hỗ trợ đăng nhập bằng **username** hoặc **email** kết hợp với mật khẩu. Hệ thống sử dụng JWT (JSON Web Token) để xác thực và phân quyền.

### Tính năng chính:
✅ Đăng nhập bằng username hoặc email  
✅ Mã hóa mật khẩu với bcrypt  
✅ JWT authentication  
✅ Phân quyền theo role (Admin, User, Technician)  
✅ Tự động kiểm tra trạng thái tài khoản (active/inactive)  

---

## 🔧 Thay đổi Backend

### 1. **User Entity** (`src/entities/user.entity.ts`)
Đã thêm trường `username`:
```typescript
@Column({ unique: true })
username: string;
```

### 2. **Login DTO** (`src/common/dto/login.dto.ts`)
Đổi từ `email` sang `username`:
```typescript
username: string; // Có thể là username hoặc email
password: string;
```

### 3. **Users Service** (`src/modules/users/users.service.ts`)
Thêm các methods mới:
- `findByUsername(username: string)`
- `findByUsernameOrEmail(identifier: string)` - Tìm user bằng username HOẶC email

### 4. **Auth Service** (`src/modules/auth/auth.service.ts`)
Cải tiến:
- Xác thực bằng username hoặc email
- Kiểm tra trạng thái tài khoản (isActive)
- Xử lý lỗi chi tiết hơn
- Response chuẩn hóa

### 5. **Auth Controller** (`src/modules/auth/auth.controller.ts`)
Cải tiến:
- Swagger documentation đầy đủ
- HTTP status codes chuẩn
- Error responses rõ ràng

### 6. **Response DTOs** (`src/common/dto/login-response.dto.ts`)
Tạo mới để chuẩn hóa API response

---

## 🎨 Thay đổi Frontend

### 1. **Auth Service** (`src/lib/authService.ts`) - MỚI
Service tương tác với backend API:
```typescript
authService.login({ username, password })
authService.register(userData)
authService.logout()
authService.getToken()
authService.getCurrentUser()
authService.isAuthenticated()
```

### 2. **API Configuration** (`src/lib/api.ts`)
Đã có sẵn, cấu hình axios với:
- Base URL từ environment variable
- Auto attach JWT token vào headers
- Error handling cho 401 (unauthorized)

---

## 📝 Cách sử dụng

### Backend Setup

#### 1. **Cập nhật Database Schema**
Chạy migration SQL để thêm column `username`:
```bash
# Kết nối với PostgreSQL
psql -U postgres -d repair_asset_fit

# Chạy migration file
\i scripts/migration-add-username.sql
```

Hoặc sử dụng TypeORM sync (development only):
```bash
npm run schema:sync
```

#### 2. **Seed Data Mẫu**
Migration đã tự động tạo 4 tài khoản mẫu:

| Role | Username | Password | Email |
|------|----------|----------|-------|
| Admin | `admin` | `Admin@123` | admin@fit.iuh.edu.vn |
| Giảng viên | `gv001` | `Gv@123456` | giaovien01@fit.iuh.edu.vn |
| Kỹ thuật viên | `ktv001` | `Ktv@123456` | kythuat01@fit.iuh.edu.vn |
| Tổ trưởng KT | `ttkt001` | `Ttkt@123456` | totruong01@fit.iuh.edu.vn |

#### 3. **Chạy Backend Server**
```bash
cd repair-asset-fit-be
npm run start:dev
```

Server sẽ chạy tại: `http://localhost:3001`

### Frontend Setup

#### 1. **Cấu hình Environment Variables**
Tạo file `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

#### 2. **Sử dụng Auth Service trong Component**
```typescript
import { authService } from '@/lib/authService';

// Đăng nhập
const handleLogin = async (username: string, password: string) => {
  try {
    const response = await authService.login({ username, password });
    console.log('Login success:', response.user);
    // Redirect sau khi login thành công
    router.push('/dashboard');
  } catch (error) {
    console.error('Login failed:', error.message);
    // Hiển thị thông báo lỗi
  }
};

// Đăng xuất
const handleLogout = () => {
  authService.logout();
  router.push('/login');
};

// Kiểm tra authentication
useEffect(() => {
  if (!authService.isAuthenticated()) {
    router.push('/login');
  }
}, []);
```

#### 3. **Cập nhật AuthContext** (Optional)
Nếu muốn tích hợp với AuthContext hiện có:
```typescript
// trong AuthContext.tsx
import { authService } from '@/lib/authService';

async function login(username: string, password: string) {
  setIsLoading(true);
  try {
    const response = await authService.login({ username, password });
    
    // Map response sang format của context
    const authenticatedUser: AuthenticatedUser = {
      id: response.user.id,
      username: response.user.username,
      fullName: `${response.user.firstName} ${response.user.lastName}`,
      email: response.user.email,
      roles: [{ 
        id: response.user.role, 
        code: response.user.role, 
        name: response.user.role 
      }],
      activeRole: { 
        id: response.user.role, 
        code: response.user.role, 
        name: response.user.role 
      },
    };
    
    setUser(authenticatedUser);
  } catch (error) {
    throw new Error((error as Error).message);
  } finally {
    setIsLoading(false);
  }
}
```

#### 4. **Chạy Frontend**
```bash
cd repair-asset-fit-fe
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3003`

---

## 📚 API Documentation

### 🔑 POST `/auth/login`
Đăng nhập vào hệ thống

**Request Body:**
```json
{
  "username": "admin",
  "password": "Admin@123"
}
```

**Success Response (200):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "admin",
    "email": "admin@fit.iuh.edu.vn",
    "firstName": "Admin",
    "lastName": "System",
    "role": "admin",
    "phone": "0123456789"
  }
}
```

**Error Response (401):**
```json
{
  "statusCode": 401,
  "message": "Tên đăng nhập hoặc mật khẩu không chính xác"
}
```

### 📝 POST `/auth/register`
Đăng ký tài khoản mới

**Request Body:**
```json
{
  "username": "newuser",
  "email": "newuser@fit.iuh.edu.vn",
  "password": "Password@123",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "phone": "0123456789"
}
```

**Success Response (201):**
```json
{
  "id": "new-uuid",
  "username": "newuser",
  "email": "newuser@fit.iuh.edu.vn",
  "firstName": "Nguyễn",
  "lastName": "Văn A",
  "role": "user",
  "isActive": true
}
```

### 🔒 Protected Routes
Sử dụng JWT token trong header:
```
Authorization: Bearer <access_token>
```

---

## 🧪 Testing

### 1. **Test với Swagger UI**
Mở trình duyệt: `http://localhost:3001/api/docs`

1. Tìm endpoint `/auth/login`
2. Click "Try it out"
3. Nhập credentials:
   ```json
   {
     "username": "admin",
     "password": "Admin@123"
   }
   ```
4. Click "Execute"
5. Copy `access_token` từ response
6. Click nút "Authorize" ở đầu trang
7. Paste token vào và click "Authorize"
8. Bây giờ bạn có thể test các protected endpoints

### 2. **Test với Postman/Insomnia**

**Login Request:**
```
POST http://localhost:3001/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Admin@123"
}
```

**Use Token for Protected Routes:**
```
GET http://localhost:3001/api/users
Authorization: Bearer <your_access_token>
```

### 3. **Test với Frontend**
Tạo component test đơn giản:
```typescript
// pages/test-login.tsx
import { authService } from '@/lib/authService';

export default function TestLogin() {
  const handleTest = async () => {
    try {
      const result = await authService.login({
        username: 'admin',
        password: 'Admin@123'
      });
      console.log('Success:', result);
      alert('Login thành công!');
    } catch (error) {
      console.error('Error:', error);
      alert('Login thất bại: ' + error.message);
    }
  };

  return (
    <div className="p-8">
      <button 
        onClick={handleTest}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Test Login
      </button>
    </div>
  );
}
```

---

## 🔍 Troubleshooting

### Backend không kết nối được database
```bash
# Kiểm tra PostgreSQL đang chạy
docker ps

# Hoặc nếu không dùng docker
psql -U postgres -l
```

### Migration lỗi
```bash
# Drop và tạo lại database (CHÚ Ý: Mất dữ liệu)
psql -U postgres
DROP DATABASE repair_asset_fit;
CREATE DATABASE repair_asset_fit;
\q

# Chạy lại migration
\i scripts/migration-add-username.sql
```

### Frontend không gọi được API
1. Kiểm tra CORS setting trong backend
2. Kiểm tra `NEXT_PUBLIC_API_URL` trong `.env.local`
3. Kiểm tra Network tab trong Browser DevTools

### Token hết hạn
Token có thời hạn 24 giờ (cấu hình trong `auth.module.ts`).  
Khi hết hạn, user cần đăng nhập lại.

---

## 📞 Liên hệ & Hỗ trợ

Nếu có vấn đề, vui lòng tạo issue hoặc liên hệ team phát triển.

---

**Ngày cập nhật:** 15/10/2025  
**Phiên bản:** 1.0.0
