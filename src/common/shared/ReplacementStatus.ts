export enum ReplacementStatus {
  CHỜ_TỔ_TRƯỞNG_DUYỆT = 'CHỜ_TỔ_TRƯỞNG_DUYỆT', // B1 - Kỹ thuật viên lập đề xuất, chờ tổ trưởng kỹ thuật sơ duyệt lần đầu
  ĐÃ_DUYỆT = 'ĐÃ_DUYỆT', // B2 - Tổ trưởng kỹ thuật đã sơ duyệt lần đầu (set teamLeadApproverId)
  ĐÃ_TỪ_CHỐI = 'ĐÃ_TỪ_CHỐI', // B3 - Tổ trưởng kỹ thuật từ chối đề xuất, cần lập lại
  ĐÃ_LẬP_TỜ_TRÌNH = 'ĐÃ_LẬP_TỜ_TRÌNH', // B4 - Tổ trưởng kỹ thuật đã lập tờ trình gửi Quản trị viên khoa
  ĐÃ_DUYỆT_TỜ_TRÌNH = 'ĐÃ_DUYỆT_TỜ_TRÌNH', // B5 - Quản trị viên khoa đã duyệt lần 2 (set facultyAdminApproverId)
  ĐÃ_TỪ_CHỐI_TỜ_TRÌNH = 'ĐÃ_TỪ_CHỐI_TỜ_TRÌNH', // B6 - Quản trị viên khoa từ chối tờ trình, cần lập lại
  CHỜ_XÁC_MINH = 'CHỜ_XÁC_MINH', // B7 - Ban giám hiệu đã phê duyệt cuối và yêu cầu Phòng Quản trị xác nhận (set principalApproverId)
  ĐÃ_XÁC_MINH = 'ĐÃ_XÁC_MINH', // B8 - Phòng Quản trị đã xác nhận theo yêu cầu của Ban giám hiệu (set adminVerifierId)
  ĐÃ_GỬI_BIÊN_BẢN = 'ĐÃ_GỬI_BIÊN_BẢN', // B9 - Sau khi xác nhận, gửi biên bản xác nhận lại cho tổ trưởng kỹ thuật ký
  ĐÃ_KÝ_BIÊN_BẢN = 'ĐÃ_KÝ_BIÊN_BẢN', // B10 - Tổ trưởng kỹ thuật đã ký biên bản xác nhận
  ĐÃ_HOÀN_TẤT_MUA_SẮM = 'ĐÃ_HOÀN_TẤT_MUA_SẮM', // B11 - Đã có thiết bị mới, hoàn tất mua sắm
}
