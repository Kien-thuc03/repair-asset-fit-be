# BÁO CÁO BỔ SUNG 2 ROLE PHÊ DUYỆT CHO ĐỀ XUẤT THAY THẾ LINH KIỆN

## 📋 TỔNG QUAN

Hiện tại hệ thống có 3 role trong quy trình đề xuất thay thế linh kiện:
1. ✅ **KTV tạo đề xuất** (`proposerId`) - Đã có
2. ✅ **Tổ trưởng kỹ thuật duyệt** (`teamLeadApproverId`) - Đã có
3. ✅ **Phòng quản trị kiểm tra** (`adminVerifierId`) - Đã có

**Cần bổ sung 2 role mới:**
4. ❌ **Quản trị viên khoa duyệt** (`facultyAdminApproverId`) - Cần thêm
5. ❌ **Ban giám hiệu duyệt** (`principalApproverId`) - Cần thêm

---

## 🔍 PHÂN TÍCH HIỆN TRẠNG

### 1. Entity: `ReplacementProposal` 
**File:** `src/entities/replacement-proposal.entity.ts`

**Các field hiện có:**
- `proposerId` (string, required) - KTV tạo đề xuất
- `teamLeadApproverId` (string, nullable) - Tổ trưởng kỹ thuật duyệt
- `adminVerifierId` (string, nullable) - Phòng quản trị kiểm tra

**Cần thêm:**
- `facultyAdminApproverId` (string, nullable) - Quản trị viên khoa duyệt
- `principalApproverId` (string, nullable) - Ban giám hiệu duyệt

**Relations hiện có:**
- `proposer` (ManyToOne → User)
- `teamLeadApprover` (ManyToOne → User, nullable)
- `adminVerifier` (ManyToOne → User, nullable)

**Cần thêm:**
- `facultyAdminApprover` (ManyToOne → User, nullable)
- `principalApprover` (ManyToOne → User, nullable)

---

### 2. Database Schema
**File:** `scripts/KLTN.sql`

**Bảng `replacementProposals` hiện có:**
```sql
CREATE TABLE "replacementProposals" (
  "id" string PRIMARY KEY,
  "title" string,
  "description" string,
  "proposalCode" string UNIQUE NOT NULL,
  "proposerId" string NOT NULL,
  "teamLeadApproverId" string,
  "adminVerifierId" string,
  "status" "ReplacementStatus" NOT NULL DEFAULT 'CHỜ_TỔ_TRƯỞNG_DUYỆT',
  "submissionFormUrl" string,
  "verificationReportUrl" string,
  "createdAt" timestamp,
  "updatedAt" timestamp
);
```

**Cần thêm 2 cột:**
```sql
ALTER TABLE "replacementProposals" 
ADD COLUMN "facultyAdminApproverId" string,
ADD COLUMN "principalApproverId" string;
```

**Cần thêm Foreign Key constraints:**
```sql
ALTER TABLE "replacementProposals"
ADD CONSTRAINT "FK_replacementProposals_facultyAdminApprover" 
  FOREIGN KEY ("facultyAdminApproverId") REFERENCES "users"("id"),
ADD CONSTRAINT "FK_replacementProposals_principalApprover" 
  FOREIGN KEY ("principalApproverId") REFERENCES "users"("id");
```

---

### 3. DTO: `UpdateReplacementProposalStatusDto`
**File:** `src/modules/replacement-proposals/dto/update-replacement-proposal-status.dto.ts`

**Các field hiện có:**
- `status` (ReplacementStatus, required)
- `teamLeadApproverId` (string, optional)
- `adminVerifierId` (string, optional)
- `submissionFormUrl` (string, optional)
- `verificationReportUrl` (string, optional)

**Cần thêm:**
- `facultyAdminApproverId` (string, optional)
- `principalApproverId` (string, optional)

---

### 4. Response DTO: `ReplacementProposalResponseDto`
**File:** `src/modules/replacement-proposals/dto/replacement-proposal-response.dto.ts`

**Các field hiện có:**
- `proposerId`, `proposer`
- `teamLeadApproverId`, `teamLeadApprover`
- `adminVerifierId`, `adminVerifier`

**Cần thêm:**
- `facultyAdminApproverId`, `facultyAdminApprover`
- `principalApproverId`, `principalApprover`

---

### 5. Service: `ReplacementProposalsService`
**File:** `src/modules/replacement-proposals/replacement-proposals.service.ts`

#### 5.1. Method `updateStatus()` - Logic auto-set approver

**Hiện tại:**
```typescript
// Auto-set approver/verifier based on status and current user
if (
  updateDto.status === ReplacementStatus.ĐÃ_DUYỆT ||
  updateDto.status === ReplacementStatus.ĐÃ_TỪ_CHỐI
) {
  proposal.teamLeadApproverId =
    updateDto.teamLeadApproverId || currentUser.id;
}

if (
  updateDto.status === ReplacementStatus.ĐÃ_XÁC_MINH ||
  updateDto.status === ReplacementStatus.ĐÃ_GỬI_BIÊN_BẢN ||
  updateDto.status === ReplacementStatus.ĐÃ_KÝ_BIÊN_BẢN
) {
  proposal.adminVerifierId = updateDto.adminVerifierId || currentUser.id;
}
```

**Cần bổ sung:**
- Logic để set `facultyAdminApproverId` khi status = `ĐÃ_DUYỆT_TỜ_TRÌNH` (hoặc status phù hợp với quy trình)
- Logic để set `principalApproverId` khi status = `ĐÃ_KÝ_BIÊN_BẢN` (hoặc status phù hợp với quy trình)

**Cần xác định:**
- Status nào sẽ trigger việc set `facultyAdminApproverId`?
- Status nào sẽ trigger việc set `principalApproverId`?

#### 5.2. Method `findOne()` - Load relations

**Hiện tại:**
```typescript
relations: [
  "proposer",
  "teamLeadApprover",
  "adminVerifier",
  "items",
  "items.oldComponent",
  "items.oldComponent.repairRequests",
  "repairRequests",
]
```

**Cần thêm:**
- `"facultyAdminApprover"`
- `"principalApprover"`

#### 5.3. Method `updateStatus()` - Load relations

**Hiện tại:**
```typescript
relations: [
  "proposer",
  "teamLeadApprover",
  "adminVerifier",
  "items",
  "items.oldComponent",
  "items.oldComponent.repairRequests",
  "repairRequests",
]
```

**Cần thêm:**
- `"facultyAdminApprover"`
- `"principalApprover"`

#### 5.4. Method `mapToResponseDto()` - Map entity to DTO

**Hiện tại:**
```typescript
teamLeadApproverId: proposal.teamLeadApproverId,
teamLeadApprover: proposal.teamLeadApprover ? { ... } : undefined,
adminVerifierId: proposal.adminVerifierId,
adminVerifier: proposal.adminVerifier ? { ... } : undefined,
```

**Cần thêm:**
```typescript
facultyAdminApproverId: proposal.facultyAdminApproverId,
facultyAdminApprover: proposal.facultyAdminApprover ? { ... } : undefined,
principalApproverId: proposal.principalApproverId,
principalApprover: proposal.principalApprover ? { ... } : undefined,
```

---

### 6. Status Flow và Logic Phê Duyệt

**Flow hiện tại:**
1. `CHỜ_TỔ_TRƯỞNG_DUYỆT` → `ĐÃ_DUYỆT` (Tổ trưởng kỹ thuật duyệt) → Set `teamLeadApproverId`
2. `ĐÃ_DUYỆT` → `ĐÃ_LẬP_TỜ_TRÌNH`
3. `ĐÃ_LẬP_TỜ_TRÌNH` → `ĐÃ_DUYỆT_TỜ_TRÌNH` → **Cần set `facultyAdminApproverId`?**
4. `ĐÃ_DUYỆT_TỜ_TRÌNH` → `CHỜ_XÁC_MINH`
5. `CHỜ_XÁC_MINH` → `ĐÃ_XÁC_MINH` (Phòng quản trị xác minh) → Set `adminVerifierId`
6. `ĐÃ_XÁC_MINH` → `ĐÃ_GỬI_BIÊN_BẢN`
7. `ĐÃ_GỬI_BIÊN_BẢN` → `ĐÃ_KÝ_BIÊN_BẢN` → **Cần set `principalApproverId`?**
8. `ĐÃ_KÝ_BIÊN_BẢN` → `ĐÃ_HOÀN_TẤT_MUA_SẮM`

**Cần xác định:**
- Quản trị viên khoa duyệt ở bước nào? (Có thể là `ĐÃ_DUYỆT_TỜ_TRÌNH`)
- Ban giám hiệu duyệt ở bước nào? (Có thể là `ĐÃ_KÝ_BIÊN_BẢN`)

---

## 🤔 PHÂN TÍCH: CÓ CẦN THÊM STATUS MỚI KHÔNG?

### Phương án 1: KHÔNG cần thêm status mới (KHUYẾN NGHỊ) ✅

**Cách làm:**
- Sử dụng lại status hiện có: `ĐÃ_DUYỆT_TỜ_TRÌNH` và `ĐÃ_KÝ_BIÊN_BẢN`
- Chỉ cần thay đổi logic set approver:
  - Khi status = `ĐÃ_DUYỆT_TỜ_TRÌNH` → Set `facultyAdminApproverId` (Quản trị viên khoa duyệt)
  - Khi status = `ĐÃ_KÝ_BIÊN_BẢN` → Set `principalApproverId` (Ban giám hiệu ký)

**Ưu điểm:**
- ✅ Không phá vỡ flow hiện tại
- ✅ Dễ triển khai, ít thay đổi code
- ✅ Không ảnh hưởng dữ liệu cũ
- ✅ Backward compatible

**Nhược điểm:**
- ⚠️ Tên status có thể không phản ánh đúng người thực hiện (nhưng có thể cập nhật comment)

### Phương án 2: Thêm status mới để tách rõ từng bước

**Cần thêm các status:**
1. `CHỜ_QUẢN_TRỊ_VIÊN_KHOA_DUYỆT` (sau `ĐÃ_LẬP_TỜ_TRÌNH`)
2. `ĐÃ_QUẢN_TRỊ_VIÊN_KHOA_DUYỆT` → Set `facultyAdminApproverId`
3. `CHỜ_BAN_GIÁM_HIỆU_DUYỆT` (sau `ĐÃ_GỬI_BIÊN_BẢN`)
4. `ĐÃ_BAN_GIÁM_HIỆU_DUYỆT` → Set `principalApproverId`

**Flow mới sẽ là:**
```
CHỜ_TỔ_TRƯỞNG_DUYỆT 
  → ĐÃ_DUYỆT (Tổ trưởng kỹ thuật)
  → ĐÃ_LẬP_TỜ_TRÌNH
  → CHỜ_QUẢN_TRỊ_VIÊN_KHOA_DUYỆT (MỚI)
  → ĐÃ_QUẢN_TRỊ_VIÊN_KHOA_DUYỆT (MỚI) → Set facultyAdminApproverId
  → CHỜ_XÁC_MINH
  → ĐÃ_XÁC_MINH (Phòng quản trị)
  → ĐÃ_GỬI_BIÊN_BẢN
  → CHỜ_BAN_GIÁM_HIỆU_DUYỆT (MỚI)
  → ĐÃ_BAN_GIÁM_HIỆU_DUYỆT (MỚI) → Set principalApproverId
  → ĐÃ_HOÀN_TẤT_MUA_SẮM
```

**Ưu điểm:**
- ✅ Rõ ràng từng bước phê duyệt
- ✅ Dễ theo dõi và audit
- ✅ Phản ánh đúng quy trình thực tế

**Nhược điểm:**
- ❌ Phải cập nhật nhiều file (enum, service, frontend)
- ❌ Phải migrate dữ liệu cũ
- ❌ Phức tạp hơn, tốn thời gian hơn

### 🎯 KHUYẾN NGHỊ

**Chọn Phương án 1** vì:
1. Đơn giản, nhanh chóng
2. Không ảnh hưởng dữ liệu cũ
3. Có thể cập nhật comment để làm rõ ai thực hiện ở mỗi bước
4. Nếu sau này cần tách rõ hơn, có thể nâng cấp lên Phương án 2

---

## ✅ CHECKLIST CẦN THỰC HIỆN

### Database
- [ ] Thêm cột `facultyAdminApproverId` vào bảng `replacementProposals`
- [ ] Thêm cột `principalApproverId` vào bảng `replacementProposals`
- [ ] Thêm Foreign Key constraints cho 2 cột mới
- [ ] Tạo migration script (nếu dùng TypeORM migrations)

### Entity
- [ ] Thêm `@Column` cho `facultyAdminApproverId` trong `ReplacementProposal`
- [ ] Thêm `@Column` cho `principalApproverId` trong `ReplacementProposal`
- [ ] Thêm `@ManyToOne` relation cho `facultyAdminApprover`
- [ ] Thêm `@ManyToOne` relation cho `principalApprover`
- [ ] Thêm `@JoinColumn` cho 2 relations mới

### DTO
- [ ] Thêm `facultyAdminApproverId` vào `UpdateReplacementProposalStatusDto`
- [ ] Thêm `principalApproverId` vào `UpdateReplacementProposalStatusDto`
- [ ] Thêm `facultyAdminApproverId`, `facultyAdminApprover` vào `ReplacementProposalResponseDto`
- [ ] Thêm `principalApproverId`, `principalApprover` vào `ReplacementProposalResponseDto`

### Service
- [ ] Cập nhật `findOne()` để load relations `facultyAdminApprover`, `principalApprover`
- [ ] Cập nhật `updateStatus()` để load relations `facultyAdminApprover`, `principalApprover`
- [ ] Thêm logic auto-set `facultyAdminApproverId` trong `updateStatus()`
- [ ] Thêm logic auto-set `principalApproverId` trong `updateStatus()`
- [ ] Cập nhật `mapToResponseDto()` để map 2 field mới

### Frontend (nếu cần)
- [ ] Cập nhật interface `ReplacementProposal` trong frontend
- [ ] Cập nhật interface `UpdateReplacementProposalStatusRequest` trong frontend
- [ ] Cập nhật UI để hiển thị 2 role mới

---

## 📝 GHI CHÚ QUAN TRỌNG

1. **Xác định Status Flow:**
   - Cần xác định rõ status nào sẽ trigger việc set `facultyAdminApproverId`
   - Cần xác định rõ status nào sẽ trigger việc set `principalApproverId`

2. **Backward Compatibility:**
   - 2 field mới là nullable, không ảnh hưởng đến dữ liệu cũ
   - Cần đảm bảo code cũ vẫn hoạt động bình thường

3. **Validation:**
   - Có thể cần thêm validation để đảm bảo đúng role mới được set
   - Có thể cần thêm permission check cho 2 role mới

4. **Testing:**
   - Test tạo đề xuất mới với 2 role mới
   - Test cập nhật status với 2 role mới
   - Test load đề xuất với 2 role mới
   - Test backward compatibility với dữ liệu cũ

---

## 🔗 CÁC FILE CẦN CHỈNH SỬA

1. `src/entities/replacement-proposal.entity.ts`
2. `src/modules/replacement-proposals/dto/update-replacement-proposal-status.dto.ts`
3. `src/modules/replacement-proposals/dto/replacement-proposal-response.dto.ts`
4. `src/modules/replacement-proposals/replacement-proposals.service.ts`
5. `scripts/KLTN.sql` (hoặc tạo migration script riêng)
6. `scripts/migration-queries.sql` (nếu có)

---

**Ngày tạo:** $(date)
**Người tạo:** AI Assistant
**Phiên bản:** 1.0

