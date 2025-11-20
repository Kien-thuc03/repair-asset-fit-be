# BÁO CÁO KIỂM TRA ĐỀ XUẤT PHẦN MỀM

## 📋 TỔNG QUAN

**Flow yêu cầu:**
1. Giảng viên tạo đề xuất
2. Tổ trưởng xem xét phê duyệt
3. Kỹ thuật viên tiếp nhận và thay thế

---

## ✅ PHẦN ĐÃ ĐÁP ỨNG

### 1. Entity: `SoftwareProposal`
**File:** `src/entities/software-proposal.entity.ts`

**Các field hiện có:**
- ✅ `proposerId` (string, required) - Giảng viên tạo đề xuất
- ✅ `approverId` (string, nullable) - Tổ trưởng duyệt
- ✅ `roomId` (string, required) - Phòng cần trang bị
- ✅ `reason` (text, required) - Lý do đề xuất
- ✅ `status` (enum, default: CHỜ_DUYỆT) - Trạng thái

**Relations:**
- ✅ `proposer` (ManyToOne → User)
- ✅ `approver` (ManyToOne → User, nullable)

### 2. Status Enum: `SoftwareProposalStatus`
**File:** `src/common/shared/SoftwareProposalStatus.ts`

**Các status hiện có:**
- ✅ `CHỜ_DUYỆT` - Đề xuất mới tạo, chờ xét duyệt
- ✅ `ĐÃ_DUYỆT` - Đã được duyệt, có thể tiến hành mua
- ✅ `ĐÃ_TỪ_CHỐI` - Bị từ chối, có thể chỉnh sửa và gửi lại
- ✅ `ĐÃ_TRANG_BỊ` - Đã hoàn thành mua và cài đặt

**Flow hiện tại:**
```
CHỜ_DUYỆT (Giảng viên tạo)
  → ĐÃ_DUYỆT (Tổ trưởng duyệt) → Set approverId
  → ĐÃ_TRANG_BỊ (Kỹ thuật viên hoàn thành)
```

---

## ❌ PHẦN CHƯA ĐÁP ỨNG

### 1. Thiếu field lưu Kỹ thuật viên tiếp nhận

**Vấn đề:**
- ❌ Không có field `technicianId` hoặc `assignedTechnicianId` để lưu kỹ thuật viên tiếp nhận và thay thế
- ❌ Logic hiện tại: Khi status = `ĐÃ_TRANG_BỊ`, nó set `approverId = currentUser.id`, nhưng thực tế đây là kỹ thuật viên, không phải tổ trưởng

**Code hiện tại (Service):**
```typescript
// Nếu cập nhật trạng thái thành ĐÃ_DUYỆT, ĐÃ_TỪ_CHỐI, hoặc ĐÃ_TRANG_BỊ, cập nhật approverId
if (
  updateDto.status &&
  [
    SoftwareProposalStatus.ĐÃ_DUYỆT,
    SoftwareProposalStatus.ĐÃ_TỪ_CHỐI,
    SoftwareProposalStatus.ĐÃ_TRANG_BỊ,  // ❌ SAI: Đây là kỹ thuật viên, không phải tổ trưởng
  ].includes(updateDto.status)
) {
  proposal.approverId = currentUser.id;  // ❌ SAI: Set approverId cho kỹ thuật viên
}
```

**Hậu quả:**
- Không thể theo dõi ai là kỹ thuật viên đã tiếp nhận và thay thế
- `approverId` bị ghi đè bởi kỹ thuật viên thay vì tổ trưởng
- Không thể audit đúng người thực hiện từng bước

---

## 🔧 CẦN BỔ SUNG

### 1. Database Schema
**Bảng `software_proposals` cần thêm:**
```sql
ALTER TABLE "software_proposals" 
ADD COLUMN "technicianId" string;
```

**Foreign Key:**
```sql
ALTER TABLE "software_proposals"
ADD CONSTRAINT "FK_software_proposals_technician" 
  FOREIGN KEY ("technicianId") REFERENCES "users"("id");
```

### 2. Entity: `SoftwareProposal`
**Cần thêm:**
```typescript
@Column({ nullable: true, comment: 'Kỹ thuật viên tiếp nhận và thay thế' })
technicianId?: string;

@ManyToOne(() => User, { nullable: true })
@JoinColumn({ name: 'technicianId' })
technician?: User;
```

### 3. DTO: `UpdateSoftwareProposalDto`
**Cần thêm:**
```typescript
@ApiPropertyOptional({
  description: "ID kỹ thuật viên tiếp nhận",
  format: "uuid",
})
@IsOptional()
@IsUUID(4, { message: "ID kỹ thuật viên phải là UUID hợp lệ" })
technicianId?: string;
```

### 4. Response DTO: `SoftwareProposalResponseDto`
**Cần thêm:**
```typescript
@Expose()
@ApiPropertyOptional({
  description: "ID kỹ thuật viên tiếp nhận",
})
technicianId?: string;

@Expose()
@Type(() => TechnicianInfoDto)
@ApiPropertyOptional({
  description: "Thông tin kỹ thuật viên tiếp nhận",
  type: TechnicianInfoDto,
})
technician?: TechnicianInfoDto;
```

### 5. Service: `SoftwareProposalsService`

#### 5.1. Method `update()` - Logic set technician

**Cần sửa:**
```typescript
// ❌ SAI: Logic hiện tại
if (
  updateDto.status &&
  [
    SoftwareProposalStatus.ĐÃ_DUYỆT,
    SoftwareProposalStatus.ĐÃ_TỪ_CHỐI,
    SoftwareProposalStatus.ĐÃ_TRANG_BỊ,  // ❌ SAI
  ].includes(updateDto.status)
) {
  proposal.approverId = currentUser.id;
}

// ✅ ĐÚNG: Logic mới
if (
  updateDto.status === SoftwareProposalStatus.ĐÃ_DUYỆT ||
  updateDto.status === SoftwareProposalStatus.ĐÃ_TỪ_CHỐI
) {
  proposal.approverId = updateDto.approverId || currentUser.id;
}

if (updateDto.status === SoftwareProposalStatus.ĐÃ_TRANG_BỊ) {
  proposal.technicianId = updateDto.technicianId || currentUser.id;
}
```

#### 5.2. Method `findOne()` - Load relations
**Cần thêm:**
```typescript
relations: ["proposer", "approver", "technician", "room", "room.unit", "items"]
```

#### 5.3. Method `transformToResponseDto()` - Map entity to DTO
**Cần thêm:**
```typescript
technicianId: proposal.technicianId,
technician: proposal.technician ? {
  id: proposal.technician.id,
  fullName: proposal.technician.fullName,
  email: proposal.technician.email,
  unitName: proposal.technician.unit?.name,
} : undefined,
```

---

## 🤔 CÓ CẦN THÊM STATUS MỚI KHÔNG?

### Phương án 1: KHÔNG cần thêm status (KHUYẾN NGHỊ) ✅

**Flow:**
```
CHỜ_DUYỆT (Giảng viên tạo)
  → ĐÃ_DUYỆT (Tổ trưởng duyệt) → Set approverId
  → ĐÃ_TRANG_BỊ (Kỹ thuật viên hoàn thành) → Set technicianId
```

**Ưu điểm:**
- ✅ Đơn giản, đủ để đáp ứng yêu cầu
- ✅ Không cần migrate dữ liệu
- ✅ Backward compatible

### Phương án 2: Thêm status trung gian (Tùy chọn)

**Có thể thêm:**
- `ĐÃ_TIẾP_NHẬN` - Kỹ thuật viên đã tiếp nhận (sau `ĐÃ_DUYỆT`)
- `ĐANG_TRANG_BỊ` - Đang trong quá trình trang bị (sau `ĐÃ_TIẾP_NHẬN`)
- `ĐÃ_TRANG_BỊ` - Hoàn thành trang bị

**Flow mới:**
```
CHỜ_DUYỆT
  → ĐÃ_DUYỆT (Tổ trưởng) → Set approverId
  → ĐÃ_TIẾP_NHẬN (Kỹ thuật viên) → Set technicianId
  → ĐANG_TRANG_BỊ (Kỹ thuật viên)
  → ĐÃ_TRANG_BỊ (Kỹ thuật viên)
```

**Khi nào cần:**
- Nếu cần theo dõi chi tiết từng bước của kỹ thuật viên
- Nếu cần phân biệt rõ "tiếp nhận" và "hoàn thành"

**Khuyến nghị:** Chọn Phương án 1 vì đơn giản và đủ dùng.

---

## ✅ CHECKLIST CẦN THỰC HIỆN

### Database
- [ ] Thêm cột `technicianId` vào bảng `software_proposals`
- [ ] Thêm Foreign Key constraint cho `technicianId`

### Entity
- [ ] Thêm `@Column` cho `technicianId` trong `SoftwareProposal`
- [ ] Thêm `@ManyToOne` relation cho `technician`
- [ ] Thêm `@JoinColumn` cho relation

### DTO
- [ ] Thêm `technicianId` vào `UpdateSoftwareProposalDto`
- [ ] Thêm `technicianId`, `technician` vào `SoftwareProposalResponseDto`
- [ ] Tạo `TechnicianInfoDto` class (nếu chưa có)

### Service
- [ ] Sửa logic trong `update()` để set `technicianId` thay vì `approverId` khi status = `ĐÃ_TRANG_BỊ`
- [ ] Cập nhật `findOne()` để load relation `technician`
- [ ] Cập nhật `transformToResponseDto()` để map `technician`

### Status (Tùy chọn)
- [ ] Quyết định có cần thêm status trung gian không
- [ ] Nếu có, thêm vào enum và cập nhật validateStatusTransition

---

## 📝 KẾT LUẬN

### Phần đã đáp ứng:
- ✅ Giảng viên tạo đề xuất (proposerId)
- ✅ Tổ trưởng duyệt (approverId)
- ✅ Status enum đủ để thể hiện flow

### Phần cần bổ sung:
- ❌ **Thiếu field `technicianId`** để lưu kỹ thuật viên tiếp nhận
- ❌ **Logic sai** khi set `approverId` cho kỹ thuật viên ở status `ĐÃ_TRANG_BỊ`

### Khuyến nghị:
1. **Bổ sung field `technicianId`** vào entity và database
2. **Sửa logic** trong service để set đúng `technicianId` khi status = `ĐÃ_TRANG_BỊ`
3. **Không cần thêm status mới** nếu flow hiện tại đủ dùng

---

**Ngày tạo:** $(date)
**Người tạo:** AI Assistant
**Phiên bản:** 1.0

