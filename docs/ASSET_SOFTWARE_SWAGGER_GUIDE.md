# 📚 Hướng Dẫn Sử Dụng API Asset Software trên Swagger

## 🎯 Tổng Quan
API Asset Software cho phép quản lý việc cài đặt phần mềm lên các tài sản máy tính trong hệ thống. Tài liệu này sẽ hướng dẫn chi tiết cách sử dụng API thông qua Swagger UI.

## 🚀 Truy Cập Swagger UI

### Bước 1: Khởi động ứng dụng
```bash
# Chạy database
docker-compose up -d db

# Khởi động ứng dụng NestJS
npm run start:dev
```

### Bước 2: Truy cập Swagger
- **URL**: `http://localhost:3000/api`
- **Tìm section**: "Asset Software" trong danh sách APIs

## 🔐 Xác Thực (Authentication)

### Bước 1: Đăng nhập để lấy token
1. Tìm section "Auth" trong Swagger
2. Sử dụng endpoint `POST /api/v1/auth/login`
3. Thông tin đăng nhập mẫu:
```json
{
  "username": "21012345",
  "password": "password123"
}
```

### Bước 2: Cấu hình Authorization
1. Copy `access_token` từ response đăng nhập
2. Click nút "🔒 Authorize" ở đầu trang Swagger
3. Nhập: `Bearer YOUR_ACCESS_TOKEN`
4. Click "Authorize"

## 📝 Hướng Dẫn Chi Tiết Các API

### 1️⃣ Cài Đặt Phần Mềm Lên Tài Sản

#### Endpoint: `POST /api/v1/asset-software`

#### Chuẩn bị dữ liệu:

**Bước 1: Lấy Asset ID (ID tài sản)**
```bash
# Gọi API để lấy danh sách tài sản máy tính
GET /api/v1/assets?shape=COMPUTER
```
Tài sản mẫu có sẵn:
- **ID**: `48b11d82-dee9-4003-b34d-d6063cbb230a`
- **Tên**: "Máy vi tính Vostro 270MT"
- **Mã KT**: "1"

**Bước 2: Lấy Software ID (ID phần mềm)**
```bash
# Gọi API để lấy danh sách phần mềm
GET /api/v1/software
```
Phần mềm mẫu có sẵn:
- **Microsoft Office 2021**: `d52a67b3-155f-4d30-8134-94de8fecf657`
- **Visual Studio Code**: `1aa594ca-83f6-4b07-bad1-a6f88d5ece3f` 
- **AutoCAD 2024**: `9252568d-6bfd-47fb-969d-64bad9f1d193`

#### Thực hiện cài đặt:

1. **Mở endpoint**: `POST /api/v1/asset-software`
2. **Click "Try it out"**
3. **Điền Request Body**:

**Ví dụ 1: Cài đặt Microsoft Office**
```json
{
  "assetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
  "softwareId": "d52a67b3-155f-4d30-8134-94de8fecf657",
  "installationDate": "2024-01-15",
  "notes": "License key: OFFICE-2021-PRO-PLUS. Cài đặt bản Professional Plus cho phòng Lab."
}
```

**Ví dụ 2: Cài đặt AutoCAD**
```json
{
  "assetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
  "softwareId": "9252568d-6bfd-47fb-969d-64bad9f1d193",
  "notes": "License giáo dục, sử dụng cho môn Thiết kế kỹ thuật"
}
```

**Ví dụ 3: Cài đặt đơn giản (chỉ cần thiết)**
```json
{
  "assetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
  "softwareId": "1aa594ca-83f6-4b07-bad1-a6f88d5ece3f"
}
```

4. **Click "Execute"**

#### Kết quả mong đợi:
```json
{
  "assetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
  "softwareId": "d52a67b3-155f-4d30-8134-94de8fecf657",
  "installationDate": "2024-01-15T00:00:00.000Z",
  "notes": "License key: OFFICE-2021-PRO-PLUS...",
  "asset": {
    "id": "48b11d82-dee9-4003-b34d-d6063cbb230a",
    "ktCode": "1",
    "fixedCode": "FC-001",
    "name": "Máy vi tính Vostro 270MT",
    "type": "FIXED_ASSET",
    "status": "IN_USE"
  },
  "software": {
    "id": "d52a67b3-155f-4d30-8134-94de8fecf657",
    "name": "Microsoft Office 2021",
    "version": "2021",
    "publisher": "Microsoft"
  },
  "room": {
    "id": "room-123",
    "name": "Phòng Lab 1",
    "building": "Tòa A",
    "floor": "Tầng 2",
    "roomNumber": "A201"
  }
}
```

### 2️⃣ Xem Danh Sách Phần Mềm Đã Cài Đặt

#### Endpoint: `GET /api/v1/asset-software`

**Cách sử dụng:**
1. Mở endpoint `GET /api/v1/asset-software`
2. Click "Try it out"
3. Tùy chọn điền các tham số lọc:
   - `page`: Số trang (mặc định: 1)
   - `limit`: Số items/trang (mặc định: 10)
   - `search`: Tìm kiếm theo tên asset/software
   - `assetId`: Lọc theo tài sản cụ thể
   - `softwareId`: Lọc theo phần mềm cụ thể

**Ví dụ tìm kiếm:**
- Tìm tất cả phần mềm Microsoft: `search=Microsoft`
- Lọc theo tài sản: `assetId=48b11d82-dee9-4003-b34d-d6063cbb230a`

### 3️⃣ Xem Chi Tiết Cài Đặt Cụ Thể

#### Endpoint: `GET /api/v1/asset-software/{assetId}/{softwareId}`

**Cách sử dụng:**
1. Mở endpoint này
2. Điền:
   - `assetId`: ID tài sản
   - `softwareId`: ID phần mềm
3. Click "Execute"

**Ví dụ:**
- `assetId`: `48b11d82-dee9-4003-b34d-d6063cbb230a`
- `softwareId`: `d52a67b3-155f-4d30-8134-94de8fecf657`

### 4️⃣ Cập Nhật Thông Tin Cài Đặt

#### Endpoint: `PUT /api/v1/asset-software/{assetId}/{softwareId}`

**Cách sử dụng:**
1. Mở endpoint này
2. Điền assetId và softwareId (như trên)
3. Điền Request Body với thông tin muốn cập nhật:

```json
{
  "installationDate": "2024-02-01",
  "notes": "Đã cập nhật license key mới: NEW-KEY-123456"
}
```

### 5️⃣ Gỡ Phần Mềm Khỏi Tài Sản

#### Endpoint: `DELETE /api/v1/asset-software/{assetId}/{softwareId}`

**Cách sử dụng:**
1. Mở endpoint này
2. Điền assetId và softwareId
3. Click "Execute"

**⚠️ Lưu ý:** Thao tác này sẽ xóa hoàn toàn bản ghi cài đặt.

### 6️⃣ APIs Tiện Ích

#### Lấy phần mềm của một tài sản:
`GET /api/v1/asset-software/asset/{assetId}`

#### Lấy tài sản có cài một phần mềm:
`GET /api/v1/asset-software/software/{softwareId}`

## ❌ Xử Lý Lỗi Thường Gặp

### 1. Status 400 - Bad Request
**Nguyên nhân:** 
- Tài sản không phải máy tính (shape != 'COMPUTER')
- Dữ liệu input không hợp lệ
- Tài sản đã bị xóa

**Giải pháp:**
- Kiểm tra lại Asset ID
- Đảm bảo tài sản có shape = 'COMPUTER'

### 2. Status 404 - Not Found
**Nguyên nhân:**
- Asset ID hoặc Software ID không tồn tại
- Không tìm thấy bản ghi cài đặt

**Giải pháp:**
- Kiểm tra lại ID có đúng không
- Gọi API lấy danh sách để verify

### 3. Status 409 - Conflict
**Nguyên nhân:**
- Phần mềm đã được cài đặt trên tài sản này

**Giải pháp:**
- Sử dụng PUT để cập nhật thay vì POST để tạo mới
- Hoặc gỡ phần mềm cũ trước khi cài lại

### 4. Status 401 - Unauthorized
**Nguyên nhân:**
- Chưa đăng nhập hoặc token hết hạn

**Giải pháp:**
- Đăng nhập lại và cập nhật token
- Kiểm tra Authorization header

## 🔧 Tips & Tricks

### 1. Sử dụng dữ liệu mẫu
- Hệ thống đã có sẵn dữ liệu mẫu để test
- Asset ID mẫu: `48b11d82-dee9-4003-b34d-d6063cbb230a`
- Software IDs mẫu có trong phần hướng dẫn trên

### 2. Testing workflow
1. Đăng nhập → Authorize
2. Lấy danh sách assets và software
3. Thử cài đặt phần mềm
4. Xem kết quả bằng GET APIs
5. Thử cập nhật và xóa

### 3. Debugging
- Kiểm tra Response Body để xem lỗi chi tiết
- Sử dụng browser Developer Tools để xem network requests
- Check server logs nếu có lỗi 500

## 📞 Hỗ Trợ

Nếu gặp vấn đề:
1. Kiểm tra lại authentication token
2. Verify dữ liệu input theo format yêu cầu
3. Xem phần Response để hiểu lỗi cụ thể
4. Liên hệ team phát triển nếu cần hỗ trợ thêm

---

**Lưu ý:** Tài liệu này được cập nhật theo version hiện tại của API. Luôn kiểm tra Swagger UI để có thông tin mới nhất.