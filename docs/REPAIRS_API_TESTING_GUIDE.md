# 🔧 Hướng Dẫn Test API Quản Lý Yêu Cầu Sửa Chữa

## 📋 Mục Lục
1. [Chuẩn bị](#chuẩn-bị)
2. [Test Cases cho PUT /api/v1/repairs/{id}](#test-cases-cho-put-apiv1repairsid)
3. [Test Cases cho các endpoint chuyên biệt](#test-cases-cho-các-endpoint-chuyên-biệt)
4. [Test Cases lỗi và validation](#test-cases-lỗi-và-validation)
5. [Quy trình test hoàn chỉnh](#quy-trình-test-hoàn-chỉnh)

## 🔐 Chuẩn Bị

### 1. Xác Thực (Authentication)
Trước khi test, cần đăng nhập để lấy JWT token:

**POST `/api/v1/auth/login`**
```json
{
  "username": "21012345",
  "password": "your_password"
}
```
**Lưu JWT token từ response để sử dụng trong Authorization header: `Bearer <token>`**

### 2. Dữ Liệu Test Thực Tế
Các ID có sẵn trong hệ thống để test:

**Repair Requests:**
- `8f0d400e-74f5-4415-a668-3eb37137bda1` (YCSC-2025-0006) - CHỜ_TIẾP_NHẬN - MAY_KHONG_KHOI_DONG
- `492cc814-35ff-477b-b548-d1cce630d5eb` (YCSC-2025-0005) - CHỜ_TIẾP_NHẬN - MAY_HU_PHAN_MEM
- `de0cdae2-1780-4f01-bad3-17f2127fc048` (YCSC-2025-0004) - CHỜ_TIẾP_NHẬN - MAY_HU_PHAN_MEM

**Users với quyền phù hợp:**
- `47d9013d-6c7e-48d2-8443-6300632ed811` (Kỹ thuật viên)
- `a949c9da-d9b4-43b1-82f4-9dd3250a749d` (Tổ trưởng Kỹ thuật)
- `26c8ba48-3be3-42e3-b28a-5a109f383b6a` (Trưởng phòng quản trị)

## 🧪 Test Cases cho PUT `/api/v1/repairs/{id}`

### Test Case 1: Tiếp Nhận Yêu Cầu
**Mô tả:** Chuyển từ CHỜ_TIẾP_NHẬN → ĐÃ_TIẾP_NHẬN
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1`
**Quyền:** Kỹ thuật viên trở lên

```json
{
  "status": "ĐÃ_TIẾP_NHẬN"
}
```

**Expected Response: 200 OK**
```json
{
  "id": "8f0d400e-74f5-4415-a668-3eb37137bda1",
  "requestCode": "YCSC-2025-0006",
  "status": "ĐÃ_TIẾP_NHẬN",
  "acceptedAt": "2025-10-23T...",
  "errorType": "MAY_KHONG_KHOI_DONG"
}
```

### Test Case 2: Phân Công Và Bắt Đầu Xử Lý
**Mô tả:** Phân công kỹ thuật viên và chuyển sang ĐANG_XỬ_LÝ
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1`
**Điều kiện:** Phải chạy Test Case 1 trước

```json
{
  "status": "ĐANG_XỬ_LÝ",
  "assignedTechnicianId": "47d9013d-6c7e-48d2-8443-6300632ed811",
  "description": "Cập nhật: Đã kiểm tra sơ bộ, nghi ngờ nguồn điện bị hỏng. Đã tháo case và kiểm tra kết nối. Không có mùi cháy. Chuẩn bị thay thế nguồn điện để test."
}
```

### Test Case 3: Cập Nhật Mô Tả Chi Tiết Lỗi Phần Mềm
**Mô tả:** Bổ sung thông tin chi tiết về lỗi Office
**Endpoint:** `PUT /api/v1/repairs/492cc814-35ff-477b-b548-d1cce630d5eb`

```json
{
  "description": "Microsoft Office 2021 không khởi động được sau khi cập nhật Windows 11 22H2.\n\n**Hiện tượng chi tiết:**\n- Click vào Word/Excel: Màn hình trắng 2-3 giây rồi tắt\n- Event Viewer: Application Error 0xc0000005\n- Safe Mode: Cũng không khởi động được\n\n**Đã thử:**\n1. Repair Office từ Control Panel ❌\n2. Chạy Office Safe Mode ❌\n3. Disable Antivirus ❌\n4. Chạy Windows Update ❌\n5. Restart máy nhiều lần ❌\n\n**Chẩn đoán:** Có thể do xung đột với Windows 11 22H2 hoặc Office bị corrupt.",
  "errorType": "MAY_HU_PHAN_MEM",
  "mediaUrls": [
    "https://example.com/office-error-1.jpg",
    "https://example.com/event-viewer-log.jpg",
    "https://example.com/office-crash-dump.txt"
  ]
}
```

### Test Case 4: Chuyển Sang Chờ Thay Thế
**Mô tả:** Xác định cần thay thế linh kiện
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1`
**Điều kiện:** Phải chạy Test Case 2 trước

```json
{
  "status": "CHỜ_THAY_THẾ",
  "resolutionNotes": "**Kết quả kiểm tra:**\n\n1. **Nguồn điện 450W hiện tại:**\n   - Test với PSU tester: Không có output\n   - Kiểm tra fuse: Fuse chính đã cháy\n   - Mở case nguồn: Tụ điện phồng, mạch IC điều khiển có vết cháy\n\n2. **Các linh kiện khác:**\n   - Mainboard: Hoạt động bình thường khi test với nguồn khác\n   - RAM: Pass memtest86\n   - HDD: Healthy, không có bad sector\n\n**Quyết định:** Cần thay thế nguồn điện mới 500W (dự phòng tương lai).\n**Đã đặt hàng:** Cooler Master MWE Bronze V2 500W\n**Nhà cung cấp:** Phong Vũ\n**Dự kiến nhận hàng:** 2-3 ngày làm việc\n**Chi phí:** 850.000 VNĐ"
}
```

### Test Case 5: Hoàn Thành Sửa Chữa Phần Cứng
**Mô tả:** Kết thúc quá trình sửa chữa thành công
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1`
**Điều kiện:** Phải chạy Test Case 4 trước

```json
{
  "status": "ĐÃ_HOÀN_THÀNH",
  "resolutionNotes": "**Quá trình thay thế và test:**\n\n1. **Lắp đặt nguồn mới:**\n   - Gỡ nguồn cũ 450W\n   - Lắp Cooler Master MWE Bronze V2 500W\n   - Kết nối lại tất cả dây nguồn (24-pin, 8-pin CPU, SATA, Molex)\n\n2. **Kiểm tra hoạt động:**\n   - Test khởi động: ✅ Thành công\n   - BIOS POST: ✅ Không có lỗi\n   - Boot Windows: ✅ Bình thường\n   - Stress test 30 phút: ✅ Nhiệt độ ổn định 45-52°C\n\n3. **Test tải nặng:**\n   - Chạy Prime95 + FurMark đồng thời 15 phút\n   - Không có restart hoặc BSOD\n   - Điện áp +12V ổn định: 11.98-12.05V\n\n4. **Bàn giao:**\n   - Dọn dẹp case, lau chùi bụi bẩn\n   - Cập nhật Windows và driver mới nhất\n   - Hướng dẫn user cách kiểm tra tình trạng nguồn\n   - Bảo hành nguồn: 24 tháng\n\n**Kết luận:** Máy hoạt động hoàn toàn bình thường, sẵn sàng đưa vào sử dụng."
}
```

### Test Case 6: Hoàn Thành Sửa Chữa Phần Mềm
**Mô tả:** Khắc phục lỗi Microsoft Office
**Endpoint:** `PUT /api/v1/repairs/492cc814-35ff-477b-b548-d1cce630d5eb`

**Cần tiếp nhận và bắt đầu xử lý trước:**
```json
{
  "status": "ĐÃ_TIẾP_NHẬN"
}
```

Sau đó:
```json
{
  "status": "ĐANG_XỬ_LÝ",
  "assignedTechnicianId": "47d9013d-6c7e-48d2-8443-6300632ed811"
}
```

Cuối cùng hoàn thành:
```json
{
  "status": "ĐÃ_HOÀN_THÀNH",
  "resolutionNotes": "**Quy trình sửa chữa Microsoft Office 2021:**\n\n1. **Chẩn đoán chi tiết:**\n   - Kiểm tra Event Viewer: Xác nhận lỗi 0xc0000005 (Access Violation)\n   - Registry scan: Phát hiện registry Office bị corrupt\n   - File integrity: Một số DLL bị thiếu/hỏng\n\n2. **Gỡ cài đặt hoàn toàn:**\n   - Sử dụng Microsoft Office Removal Tool\n   - Xóa thủ công registry keys còn sót lại\n   - Clean temp files và cache\n\n3. **Cài đặt lại:**\n   - Download Office 2021 từ portal chính thức\n   - Cài đặt với quyền Administrator\n   - Apply tất cả updates mới nhất (Version 2308 Build 16731.20234)\n\n4. **Kiểm tra và test:**\n   - Word: ✅ Mở file .docx bình thường\n   - Excel: ✅ Tính toán macro hoạt động\n   - PowerPoint: ✅ Animation và media playback OK\n   - Outlook: ✅ Đồng bộ email thành công\n\n5. **Tối ưu hóa:**\n   - Disable unnecessary add-ins\n   - Configure auto-save và backup\n   - Tạo desktop shortcuts mới\n\n**Kết quả:** Office 2021 hoạt động hoàn toàn bình thường, đã test với file mẫu phức tạp.",
  "errorType": "MAY_HU_PHAN_MEM"
}
```

### Test Case 7: Hủy Yêu Cầu - Người Dùng Tự Khắc Phục
**Mô tả:** Hủy yêu cầu do người dùng đã tự xử lý
**Endpoint:** `PUT /api/v1/repairs/de0cdae2-1780-4f01-bad3-17f2127fc048`

```json
{
  "status": "ĐÃ_HỦY",
  "resolutionNotes": "**Tình huống:**\nNgười dùng liên hệ báo đã tự khắc phục được sự cố Office.\n\n**Nguyên nhân và giải pháp của user:**\n- Phát hiện Windows Defender đã block một số file Office\n- Tự thêm Office vào whitelist của antivirus\n- Chạy Office Safe Mode và reset settings\n- Sau khi restart, Office hoạt động bình thường\n\n**Xác minh:**\n- Remote check: Xác nhận Office đang hoạt động OK\n- User có thể mở và edit file .docx, .xlsx\n- Không cần can thiệp kỹ thuật\n\n**Ghi chú:** Đã hướng dẫn user cách phòng tránh tương lai."
}
```

## 🚀 Test Cases Cho Các Endpoint Chuyên Biệt

### Test Case 8: Accept Request
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/accept`

```json
{}
```
**Expected Response: 200 OK với acceptedAt timestamp**

### Test Case 9: Assign Technician
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/assign`
**Điều kiện:** Request phải ở trạng thái ĐÃ_TIẾP_NHẬN

```json
{
  "technicianId": "47d9013d-6c7e-48d2-8443-6300632ed811",
  "assignmentNotes": "Kỹ thuật viên Anh Tuấn có 3 năm kinh nghiệm sửa chữa phần cứng, đặc biệt chuyên về nguồn điện và mainboard. Hiện tại đang xử lý 2/5 yêu cầu, có thể nhận thêm công việc."
}
```

### Test Case 10: Start Processing
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/start-processing`
**Điều kiện:** Phải có technician được assign

```json
{
  "processingNotes": "Bắt đầu chẩn đoán chi tiết. Dự kiến thời gian: 2-3 tiếng cho kiểm tra phần cứng đầy đủ."
}
```

### Test Case 11: Complete Request
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/complete`

```json
{
  "resolutionNotes": "Hoàn thành thay thế nguồn điện. Máy hoạt động bình thường, đã test ổn định 30 phút."
}
```

### Test Case 12: Cancel Request
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1/cancel`

```json
{
  "cancelReason": "Người dùng đã tự khắc phục sự cố bằng cách kiểm tra dây nguồn."
}
```

## ❌ Test Cases Lỗi và Validation

### Test Case 13: Chuyển Trạng Thái Không Hợp Lệ
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1`

```json
{
  "status": "ĐÃ_HOÀN_THÀNH"
}
```
**Expected: 400 Bad Request**
```json
{
  "statusCode": 400,
  "message": "Không thể chuyển từ trạng thái CHỜ_TIẾP_NHẬN sang ĐÃ_HOÀN_THÀNH",
  "error": "Bad Request"
}
```

### Test Case 14: ID Không Tồn Tại
**Endpoint:** `PUT /api/v1/repairs/00000000-0000-0000-0000-000000000000`

```json
{
  "status": "ĐÃ_TIẾP_NHẬN"
}
```
**Expected: 404 Not Found**

### Test Case 15: Thiếu Quyền Truy Cập
**Mô tả:** Sử dụng token của user không có quyền
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1`

```json
{
  "status": "ĐÃ_TIẾP_NHẬN"
}
```
**Expected: 403 Forbidden**

### Test Case 16: Validation Lỗi
**Endpoint:** `PUT /api/v1/repairs/8f0d400e-74f5-4415-a668-3eb37137bda1`

```json
{
  "status": "INVALID_STATUS",
  "assignedTechnicianId": "not-a-valid-uuid",
  "description": ""
}
```
**Expected: 400 Bad Request với chi tiết lỗi validation**

## 📊 Quy Trình Test Hoàn Chỉnh

### Scenario A: Sửa Chữa Phần Cứng Thành Công
1. **Login** → Lấy JWT token
2. **Test Case 1** (Tiếp nhận) → CHỜ_TIẾP_NHẬN → ĐÃ_TIẾP_NHẬN
3. **Test Case 2** (Phân công + bắt đầu) → ĐÃ_TIẾP_NHẬN → ĐANG_XỬ_LÝ
4. **Test Case 4** (Chờ thay thế) → ĐANG_XỬ_LÝ → CHỜ_THAY_THẾ
5. **Test Case 5** (Hoàn thành) → CHỜ_THAY_THẾ → ĐÃ_HOÀN_THÀNH

**Verify:**
- ✅ Timestamps được cập nhật đúng
- ✅ Asset status được cập nhật
- ✅ Logs được ghi nhận đầy đủ

### Scenario B: Sửa Chữa Phần Mềm
1. **Test Case 3** (Cập nhật mô tả chi tiết)
2. **Tiếp nhận và phân công**
3. **Test Case 6** (Hoàn thành sửa phần mềm)

### Scenario C: Hủy Yêu Cầu
1. **Test Case 7** (Hủy với lý do hợp lý)
2. **Verify** asset status được restore

### Scenario D: Test Validation và Error Handling
1. **Test Case 13-16** (Các trường hợp lỗi)
2. **Verify** error responses và status codes

## 🔍 Checklist Kiểm Tra

Sau mỗi test case, verify:

### Response Validation:
- [ ] Status code đúng (200, 400, 403, 404)
- [ ] Response body có đầy đủ thông tin
- [ ] Timestamps được format đúng ISO 8601
- [ ] Relationships được load đầy đủ

### Database Consistency:
- [ ] repair_requests table được cập nhật
- [ ] repair_logs có entry mới (nếu cần)
- [ ] assets status được sync
- [ ] Foreign keys vẫn consistent

### Business Logic:
- [ ] Status transitions tuân theo quy tắc
- [ ] Permission checks hoạt động đúng
- [ ] Validation rules được enforce
- [ ] Timestamps logic đúng (acceptedAt, completedAt)

### Error Handling:
- [ ] Error messages rõ ràng và hữu ích
- [ ] Không leak sensitive information
- [ ] Consistent error format
- [ ] Proper HTTP status codes

## 📈 Performance Testing

### Load Testing:
- Test với 50+ concurrent requests
- Verify response time < 500ms
- Check database connection pooling
- Monitor memory usage

### Edge Cases:
- Very long descriptions (1900+ characters)
- Multiple rapid status changes
- Concurrent updates by different users
- Network timeout scenarios

---

**Lưu ý:** Tất cả test cases này được thiết kế dựa trên dữ liệu thực tế trong database và tuân theo đúng business rules của hệ thống quản lý tài sản sửa chữa.