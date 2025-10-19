# Users Module

## Mô tả
Module quản lý người dùng trong hệ thống Repair Asset Management. Module này cung cấp đầy đủ chức năng CRUD cho người dùng với các tính năng:

- ✅ Tạo, đọc, cập nhật, xóa người dùng
- ✅ Phân trang và tìm kiếm
- ✅ Lọc theo nhiều tiêu chí (status, unit, role)
- ✅ Soft delete và hard delete
- ✅ Hash mật khẩu tự động với bcryptjs
- ✅ Validation đầy đủ với thông báo lỗi tiếng Việt
- ✅ Swagger documentation hoàn chỉnh

## Cấu trúc

```
users/
├── dto/
│   ├── create-user.dto.ts      # DTO cho tạo người dùng
│   ├── update-user.dto.ts      # DTO cho cập nhật người dùng
│   ├── delete-user.dto.ts      # DTO cho xóa người dùng
│   ├── query-user.dto.ts       # DTO cho query/filter
│   ├── user-response.dto.ts    # DTO cho response
│   └── index.ts                # Export tất cả DTOs
├── users.controller.ts         # REST API endpoints
├── users.service.ts            # Business logic
└── users.module.ts             # Module definition
```

## DTOs

### CreateUserDto
Dùng để tạo người dùng mới.

**Trường bắt buộc:**
- `username`: Tên đăng nhập (3-50 ký tự, chỉ chữ, số, dấu gạch dưới)
- `password`: Mật khẩu (≥6 ký tự, phải có chữ hoa, chữ thường, số, ký tự đặc biệt)
- `fullName`: Họ tên (≤100 ký tự)
- `email`: Email hợp lệ

**Trường tùy chọn:**
- `unitId`: UUID của đơn vị
- `phoneNumber`: Số điện thoại Việt Nam
- `birthDate`: Ngày sinh (YYYY-MM-DD)
- `status`: Trạng thái (mặc định: ACTIVE)
- `roleIds`: Mảng UUID của các vai trò

### UpdateUserDto
Dùng để cập nhật thông tin người dùng. Tất cả trường đều optional.

### DeleteUserDto
Dùng để xóa người dùng.
- `hard`: boolean (mặc định false) - true = xóa vĩnh viễn, false = xóa mềm

### QueryUserDto
Dùng để tìm kiếm và lọc danh sách người dùng.

**Tham số:**
- `search`: Tìm kiếm theo username/fullName/email
- `status`: Lọc theo UserStatus
- `unitId`: Lọc theo đơn vị
- `roleId`: Lọc theo vai trò
- `page`: Số trang (mặc định: 1)
- `limit`: Số bản ghi/trang (1-100, mặc định: 10)
- `sortBy`: Trường sắp xếp (mặc định: createdAt)
- `sortOrder`: ASC/DESC (mặc định: DESC)

### UserResponseDto
DTO trả về thông tin người dùng (không bao gồm password).

## API Endpoints

### GET /users
Lấy danh sách người dùng với phân trang và bộ lọc.

**Query Parameters:** Xem QueryUserDto

**Response:**
```typescript
{
  data: UserResponseDto[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
```

### GET /users/:id
Lấy thông tin chi tiết một người dùng.

**Response:** `UserResponseDto`

### POST /users
Tạo người dùng mới.

**Body:** `CreateUserDto`

**Response:** `UserResponseDto`

### PUT /users/:id
Cập nhật thông tin người dùng.

**Body:** `UpdateUserDto`

**Response:** `UserResponseDto`

### DELETE /users/:id
Xóa người dùng.

**Query:** `?hard=true/false`

**Response:**
```typescript
{
  message: string;
}
```

## Service Methods

### Public Methods

#### findAll(query: QueryUserDto)
Lấy danh sách người dùng với phân trang, tìm kiếm và lọc.

**Features:**
- Tìm kiếm full-text trên username, fullName, email
- Lọc theo status, unitId, roleId
- Sắp xếp theo nhiều trường
- Phân trang với total count

#### findOne(id: string)
Lấy thông tin một người dùng theo ID.

**Throws:**
- `NotFoundException`: Không tìm thấy người dùng

#### findByEmail(email: string)
Tìm người dùng theo email. Trả về `User | null`.

#### findByUsername(username: string)
Tìm người dùng theo username. Trả về `User | null`.

#### findByUsernameOrEmail(identifier: string)
Tìm người dùng theo username hoặc email. Trả về `User | null`.

Hữu ích cho login.

#### create(createUserDto: CreateUserDto)
Tạo người dùng mới.

**Features:**
- Kiểm tra username/email trùng lặp
- Hash mật khẩu tự động
- Gán roles nếu có roleIds

**Throws:**
- `ConflictException`: Username hoặc email đã tồn tại

#### update(id: string, updateUserDto: UpdateUserDto)
Cập nhật thông tin người dùng.

**Features:**
- Kiểm tra username/email trùng lặp (nếu thay đổi)
- Hash mật khẩu mới nếu có
- Cập nhật roles nếu có roleIds

**Throws:**
- `NotFoundException`: Không tìm thấy người dùng
- `ConflictException`: Username hoặc email đã tồn tại

#### remove(id: string, deleteUserDto: DeleteUserDto)
Xóa người dùng.

**Features:**
- Soft delete (mặc định): Giữ lại trong DB với deletedAt
- Hard delete: Xóa vĩnh viễn khỏi DB

**Throws:**
- `NotFoundException`: Không tìm thấy người dùng

### Private Methods

#### toUserResponseDto(user: User)
Chuyển đổi User entity sang UserResponseDto, loại bỏ password.

## Security

### Password Hashing
- Sử dụng bcryptjs với salt rounds = 10
- Password tự động hash khi create/update
- Password không bao giờ trả về trong response

### Input Validation
- Tất cả input đều được validate với class-validator
- Thông báo lỗi tiếng Việt dễ hiểu
- Whitelist mode để loại bỏ các field không mong muốn

### UUID Validation
- Tất cả ID đều validate UUID v4
- ParseUUIDPipe tự động validate trong controller

## Usage Examples

### Import Module
```typescript
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [UsersModule],
})
export class AppModule {}
```

### Inject Service
```typescript
import { UsersService } from './modules/users/users.service';

@Injectable()
export class AuthService {
  constructor(private readonly usersService: UsersService) {}

  async validateUser(username: string, password: string) {
    const user = await this.usersService.findByUsername(username);
    // ... logic
  }
}
```

### Call from Controller
```typescript
// Tạo user mới
const newUser = await this.usersService.create({
  username: 'john_doe',
  password: 'Password@123',
  fullName: 'John Doe',
  email: 'john@example.com',
});

// Tìm kiếm user
const users = await this.usersService.findAll({
  search: 'john',
  status: UserStatus.ACTIVE,
  page: 1,
  limit: 10,
});

// Cập nhật user
await this.usersService.update(userId, {
  status: UserStatus.INACTIVE,
});

// Xóa mềm user
await this.usersService.remove(userId, { hard: false });
```

## Relations

User entity có các relations sau:

- `roles`: Many-to-Many với Role (qua bảng user_roles)
- `unit`: Many-to-One với Unit
- `createdAssets`: One-to-Many với Asset
- `createdInventorySessions`: One-to-Many với InventorySession
- `reportedRepairRequests`: One-to-Many với RepairRequest
- `assignedRepairRequests`: One-to-Many với RepairRequest
- `repairLogs`: One-to-Many với RepairLog
- `technicianAssignments`: One-to-Many với TechnicianAssignment

## Testing

### Unit Tests
```bash
npm run test -- users.service.spec.ts
```

### E2E Tests
```bash
npm run test:e2e -- users.e2e-spec.ts
```

### Manual Testing
Sử dụng Swagger UI:
```
http://localhost:3000/api/docs
```

## Error Handling

Module sử dụng các NestJS exceptions:

- `BadRequestException`: Dữ liệu đầu vào không hợp lệ
- `NotFoundException`: Không tìm thấy resource
- `ConflictException`: Dữ liệu trùng lặp (username, email)

Tất cả exceptions đều có message tiếng Việt.

## Migration

Nếu thay đổi User entity, cần tạo migration:

```bash
npm run typeorm migration:generate -- src/migrations/UpdateUserTable
npm run typeorm migration:run
```

## Best Practices

1. **Không bao giờ trả về password** trong response
2. **Luôn hash password** trước khi lưu
3. **Sử dụng soft delete** để giữ lại lịch sử
4. **Validate UUID** ở controller level với ParseUUIDPipe
5. **Kiểm tra trùng lặp** username/email trước khi create/update
6. **Load relations** khi cần thiết để tránh N+1 query
7. **Sử dụng transactions** cho các thao tác phức tạp

## Dependencies

- `@nestjs/common`: NestJS core decorators và utilities
- `@nestjs/typeorm`: TypeORM integration
- `typeorm`: ORM cho PostgreSQL
- `class-validator`: Input validation
- `class-transformer`: Object transformation
- `bcryptjs`: Password hashing
- `@nestjs/swagger`: API documentation

## Changelog

### v1.0.0 - 2025-10-19
- ✅ Implement CRUD operations
- ✅ Add pagination and filtering
- ✅ Add soft delete support
- ✅ Add password hashing
- ✅ Add comprehensive validation
- ✅ Add Swagger documentation
- ✅ Add Vietnamese error messages

---

**Maintainer:** Repair Asset Management Team  
**Last Updated:** October 19, 2025
