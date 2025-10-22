# Asset Software Management API

API để quản lý việc thêm/xóa phần mềm vào máy tính trong hệ thống quản lý tài sản.

## 🚀 Tính năng

- ✅ Thêm phần mềm vào máy tính
- ✅ Xem danh sách phần mềm được cài đặt (có phân trang, lọc, tìm kiếm)
- ✅ Xem chi tiết phần mềm được cài trên một tài sản
- ✅ Cập nhật thông tin cài đặt (ngày cài, ghi chú license)
- ✅ Gỡ bỏ phần mềm khỏi tài sản
- ✅ Lấy danh sách phần mềm của một tài sản cụ thể
- ✅ Lấy danh sách tài sản có cài một phần mềm cụ thể

## 📊 Database Schema

### Bảng Software
```sql
Table Software {
  id string [primary key, note: 'UUID']
  name string [not null, note: 'Tên phần mềm, vd: Microsoft Office 2021, AutoCAD 2024']
  version string [note: 'Phiên bản phần mềm']
  publisher string [note: 'Nhà sản xuất']
  createdAt timestamp
}
```

### Bảng AssetSoftware (Junction table)
```sql
Table AssetSoftware {
  assetId string [not null, ref: > assets.id, note: 'ID của máy tính']
  softwareId string [not null, ref: > Software.id, note: 'ID của phần mềm']
  installationDate date [note: 'Ngày cài đặt']
  notes text [note: 'Ghi chú, ví dụ: key license']
}
```

## 🔧 API Endpoints

### 1. Thêm phần mềm vào máy tính
```http
POST /asset-software
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "assetId": "123e4567-e89b-12d3-a456-426614174000",
  "softwareId": "123e4567-e89b-12d3-a456-426614174001",
  "installationDate": "2024-01-15",
  "notes": "License key: ABCD-EFGH-IJKL-MNOP"
}
```

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Đã thêm phần mềm \"Microsoft Office 2021\" vào tài sản \"Computer-001\" thành công",
  "data": {
    "assetId": "123e4567-e89b-12d3-a456-426614174000",
    "softwareId": "123e4567-e89b-12d3-a456-426614174001",
    "installationDate": "2024-01-15",
    "notes": "License key: ABCD-EFGH-IJKL-MNOP",
    "asset": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Computer-001",
      "ktCode": "19-0205/00",
      "fixedCode": "1234.5678"
    },
    "software": {
      "id": "123e4567-e89b-12d3-a456-426614174001",
      "name": "Microsoft Office 2021",
      "version": "2021 Professional",
      "publisher": "Microsoft Corporation"
    }
  }
}
```

### 2. Lấy danh sách phần mềm được cài đặt
```http
GET /asset-software?page=1&limit=10&search=Microsoft&sortBy=installationDate&sortOrder=DESC
Authorization: Bearer {jwt_token}
```

**Query Parameters:**
- `page` (optional): Số trang, default = 1
- `limit` (optional): Số items per page, default = 5, max = 100
- `assetId` (optional): Lọc theo ID tài sản
- `softwareId` (optional): Lọc theo ID phần mềm
- `search` (optional): Tìm kiếm theo tên tài sản hoặc tên phần mềm
- `sortBy` (optional): Sắp xếp theo trường (installationDate, assetName, softwareName)
- `sortOrder` (optional): ASC hoặc DESC

### 3. Lấy chi tiết phần mềm được cài đặt
```http
GET /asset-software/{assetId}/{softwareId}
Authorization: Bearer {jwt_token}
```

### 4. Cập nhật thông tin cài đặt
```http
PUT /asset-software/{assetId}/{softwareId}
Authorization: Bearer {jwt_token}
Content-Type: application/json

{
  "installationDate": "2024-01-20",
  "notes": "Updated license key: XYZ789-ABC123"
}
```

### 5. Gỡ bỏ phần mềm khỏi tài sản
```http
DELETE /asset-software/{assetId}/{softwareId}
Authorization: Bearer {jwt_token}
```

### 6. Lấy danh sách phần mềm của một tài sản
```http
GET /asset-software/asset/{assetId}?page=1&limit=10
Authorization: Bearer {jwt_token}
```

### 7. Lấy danh sách tài sản có cài một phần mềm
```http
GET /asset-software/software/{softwareId}?page=1&limit=10
Authorization: Bearer {jwt_token}
```

## 🧪 Testing với MCP Server

### Cài đặt MCP Server
```bash
# Copy file mcp-package.json thành package.json trong thư mục riêng
mkdir asset-software-mcp
cd asset-software-mcp
cp ../mcp-package.json package.json
cp ../mcp-asset-software-server.js .

# Install dependencies
npm install

# Chạy MCP server
npm start
```

### Sử dụng MCP Tools

MCP server cung cấp các tools sau:
- `add_software_to_asset` - Thêm phần mềm vào tài sản
- `get_asset_software_list` - Lấy danh sách với phân trang và lọc
- `get_asset_software_detail` - Lấy chi tiết
- `update_asset_software` - Cập nhật thông tin
- `remove_software_from_asset` - Gỡ bỏ phần mềm
- `get_software_by_asset` - Lấy phần mềm của một tài sản
- `get_assets_by_software` - Lấy tài sản có cài một phần mềm

## 🧪 Testing với Script

```bash
# Cập nhật test data trong file test-asset-software-api.js
# Chạy test
node test-asset-software-api.js
```

## 🔒 Authentication

Tất cả endpoints yêu cầu JWT authentication:
```http
Authorization: Bearer {jwt_token}
```

Lấy JWT token bằng cách đăng nhập:
```http
POST /auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password"
}
```

## 📋 Error Codes

- **400 Bad Request**: Dữ liệu đầu vào không hợp lệ
- **401 Unauthorized**: Chưa đăng nhập hoặc token không hợp lệ  
- **404 Not Found**: Không tìm thấy tài sản, phần mềm, hoặc bản ghi cài đặt
- **409 Conflict**: Phần mềm đã được cài đặt trên tài sản này

## 🛠️ Module Structure

```
src/modules/asset-software/
├── dto/
│   ├── create-asset-software.dto.ts
│   ├── update-asset-software.dto.ts
│   ├── asset-software-response.dto.ts
│   └── asset-software-filter.dto.ts
├── interfaces/
│   └── response.interface.ts
├── asset-software.controller.ts
├── asset-software.service.ts
└── asset-software.module.ts
```

## 📚 Usage Examples

### Ví dụ: Cài Microsoft Office cho máy tính
```javascript
// 1. Thêm phần mềm vào máy tính
const response = await fetch('/asset-software', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    assetId: 'computer-uuid',
    softwareId: 'office-uuid',
    installationDate: '2024-01-15',
    notes: 'Office 2021 Professional - License: ABC123'
  })
});

// 2. Xem danh sách phần mềm của máy tính
const softwareList = await fetch('/asset-software/asset/computer-uuid');

// 3. Cập nhật thông tin license
await fetch('/asset-software/computer-uuid/office-uuid', {
  method: 'PUT',
  body: JSON.stringify({
    notes: 'Updated license key: XYZ789'
  })
});
```

## 🔍 Query Examples

### Tìm kiếm phần mềm Microsoft trên tất cả máy tính:
```
GET /asset-software?search=Microsoft&sortBy=installationDate&sortOrder=DESC
```

### Lấy tất cả phần mềm của phòng IT:
```
GET /asset-software?assetId=it-room-computer-1&page=1&limit=20
```

### Kiểm tra máy nào đã cài AutoCAD:
```
GET /asset-software/software/autocad-uuid
```