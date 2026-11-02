# MARIXA · Thiết kế giao diện

Skill yêu cầu: [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), tải về `tools/ui-ux-pro-max-source`, commit `3a13158ff1f32156cbe144108de48eda2ecaed9a`. Bản skill cũng đã có sẵn tại `C:/Users/khang/.codex/skills/ui-ux-pro-max`; bản tải trong workspace phục vụ đối chiếu và truy vấn. Thư mục tools không đưa vào Git dự án.

Đã đọc SKILL.md, chạy `--design-system` với `internal employee reporting dashboard`, truy vấn lại `enterprise dashboard`, bổ sung `enterprise reporting --domain style` và `forms responsive accessibility --stack nextjs`. Phần pattern mặc định Hero/CTA không phù hợp công cụ báo cáo nên không sử dụng. Áp dụng hướng Minimalism & Swiss, phân cấp rõ ràng, thẻ dữ liệu và ưu tiên thao tác chạm từ guideline; giữ màu theo logo thay bảng màu đề xuất.

## Nhận diện

Logo gốc người dùng cung cấp tại `public/marixa-logo.png`, giữ đúng tỷ lệ. Xanh dương `#0955dc` cho thao tác chính, xanh ngọc `#087c79` cho trạng thái tích cực, vàng `#f4c34d` làm điểm nhấn. Nền `#f5f7fb`, thẻ trắng, chữ `#182943`. Font Be Vietnam Pro có đầy đủ tiếng Việt và đóng gói local để xuất ảnh ổn định.

## Giao diện

- Laptop: sidebar điều hướng, form và ảnh xem trước cạnh nhau ở màn hình đủ rộng. Không thêm chức năng ngoài báo cáo và quản lý nhân viên.
- Mobile: một cột, điều hướng đáy, nút lưu dễ chạm và xem trước phía dưới. Hỗ trợ safe area, textarea co giãn, nội dung không bị cắt.
- Đầu ngày: xanh dương–ngọc, điểm nhấn nắng vàng. Cuối ngày: xanh navy và vàng nhạt. Cấu trúc giữ đồng nhất để sếp dễ đối chiếu.
- Mẫu ảnh dùng typography theo chiều rộng container, cùng cấu trúc trên mọi kích thước; xuất độ rộng 1520 px và chiều cao theo nội dung.
- Tương tác bàn phím, focus rõ, label trường nhập, thông báo lỗi và trạng thái đang xử lý. Giảm chuyển động khi hệ điều hành bật reduced motion.

## Quyền và dữ liệu hiển thị

Các mục cá nhân khớp profile; chức vụ là nội dung báo cáo. Vai trò/phòng ban không quyết định quyền sửa báo cáo người khác. Không hiển thị mật khẩu cũ. Chế độ mẫu ghi rõ trên màn hình và bị tắt khi có cấu hình Supabase.
