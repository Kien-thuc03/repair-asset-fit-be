# 🚀 Hướng Dẫn Nhanh - API Cài Đặt Phần Mềm

## ✅ Bước Chuẩn Bị

1. **Khởi động server**: `npm run start:dev`
2. **Truy cập Swagger**: http://localhost:3000/api
3. **Đăng nhập**: Section "Auth" → POST /api/v1/auth/login
   ```json
   { "username": "21012345", "password": "password123" }
   ```
4. **Authorize**: Click 🔒 → Nhập `Bearer YOUR_TOKEN`

## 📝 Cài Đặt Phần Mềm - POST /api/v1/asset-software

### Dữ Liệu Cần Thiết:

- **Asset ID** (máy tính): `48b11d82-dee9-4003-b34d-d6063cbb230a`
- **Software ID** (phần mềm):
  - Microsoft Office: `d52a67b3-155f-4d30-8134-94de8fecf657`
  - Visual Studio Code: `1aa594ca-83f6-4b07-bad1-a6f88d5ece3f`
  - AutoCAD: `9252568d-6bfd-47fb-969d-64bad9f1d193`

### Ví Dụ Request:

```json
{
  "assetId": "48b11d82-dee9-4003-b34d-d6063cbb230a",
  "softwareId": "d52a67b3-155f-4d30-8134-94de8fecf657",
  "installationDate": "2024-01-15",
  "notes": "License key: ABC123-DEF456"
}
```

## 🔍 Các API Khác:

- **Xem danh sách**: GET /api/v1/asset-software
- **Xem chi tiết**: GET /api/v1/asset-software/{assetId}/{softwareId}
- **Cập nhật**: PUT /api/v1/asset-software/{assetId}/{softwareId}
- **Xóa**: DELETE /api/v1/asset-software/{assetId}/{softwareId}

## 📖 Tài Liệu Chi Tiết:

Xem file `ASSET_SOFTWARE_SWAGGER_GUIDE.md` để có hướng dẫn đầy đủ.

---

_💡 Tip: Sử dụng examples có sẵn trong Swagger UI để test nhanh!_
