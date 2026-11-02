# MARIXA Report

Ứng dụng báo cáo công việc nội bộ, ưu tiên mobile, thiết kế theo logo MARIXA. Next.js App Router + TypeScript + Supabase Auth/PostgreSQL. Phông Be Vietnam Pro được đóng gói cùng ứng dụng; không cần tải font từ Google khi sử dụng.

## Luồng sử dụng

1. Đăng nhập bằng vai trò, họ tên và mật khẩu; nhân viên chọn thêm phòng ban.
2. Tạo báo cáo **đầu ngày**: chức vụ, tối đa 3 trọng tâm, 1–20 nhiệm vụ, KPI tùy chọn, ghi chú.
3. Lưu, sau đó bấm **Cuối ngày** hoặc **Báo cáo cuối ngày** trong lịch sử. Nhiệm vụ và mục tiêu KPI được chuyển từ bản đầu ngày.
4. Cuối ngày nhập tiến độ % và ghi chú kết quả từng task, thêm việc phát sinh, kết quả nổi bật, KPI thực tế và bài học.
5. Lưu bản cuối ngày riêng, có liên kết với bản đầu ngày. Nếu đã có bản cuối ngày, mở lại để sửa. Mỗi người có tối đa một bản mỗi loại mỗi ngày.
6. Tải ảnh PNG rộng 1520 px hoặc chuẩn bị ảnh rồi bấm **Chọn ứng dụng** để chọn Zalo trong bảng chia sẻ. Nếu máy không hỗ trợ chia sẻ file, tải ảnh rồi đính kèm trong Zalo.

Nhân viên xem/sửa/xóa báo cáo của mình. Admin xem mọi báo cáo, có quyền thêm/sửa/xóa **tài khoản nhân viên**, đồng thời báo cáo như nhân viên. Admin không sửa báo cáo của người khác. Mật khẩu không lưu vào bảng hồ sơ, không hiển thị lại; admin có thể đặt mật khẩu mới.

Ngày/loại báo cáo được cố định sau khi lưu để giữ liên kết đầu–cuối ngày. Có thể sửa các nội dung còn lại. Muốn xóa cặp báo cáo, xóa bản cuối ngày trước rồi bản đầu ngày. Xóa nhân viên giữ lại báo cáo và thông tin tác giả tại thời điểm tạo cho admin tra cứu.

## Chạy trên máy

Yêu cầu Node.js 22. Không cần Supabase để xem thử giao diện.

```powershell
npm.cmd ci
npm.cmd run dev
```

Mở http://127.0.0.1:3000. Chọn Nhân viên/Admin rồi bấm **Trải nghiệm**. Đây là chế độ mẫu, dữ liệu nằm trong localStorage của trình duyệt; không phải tài khoản công ty và không lưu mật khẩu mẫu. Không nhập dữ liệu thật vào bản mẫu.

Khi điền Supabase URL và publishable key, chế độ xem thử tự tắt. Đăng nhập thật dùng Supabase Auth, đọc/ghi báo cáo được bảo vệ bằng Row Level Security. API quản lý nhân viên xác minh token và quyền admin ở server cho từng yêu cầu.

## Thiết lập dịch vụ

Làm theo [hướng dẫn Supabase và Vercel từng bước](docs/SETUP.md). Chưa có dự án Supabase hoặc cấu hình Vercel được tạo tự động trong kho này.

**Vercel Hobby:** tài liệu hiện hành quy định mục đích cá nhân, phi thương mại. Cần chọn gói/hosting phù hợp trước khi dùng chính thức cho công ty; không mặc định ứng dụng nội bộ công ty đủ điều kiện dùng Hobby. Nguồn: [Vercel Hobby](https://vercel.com/docs/plans/hobby).

## Kiểm tra

```powershell
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
$env:PLAYWRIGHT_BROWSERS_PATH = Join-Path (Get-Location) '.browsers'
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

- Unit tests: chuẩn hóa danh tính đăng nhập, xác thực báo cáo, chuyển đầu ngày sang cuối ngày.
- Database tests: chạy migration trên PostgreSQL qua PGlite, kiểm tra RLS, chặn tự nâng quyền, ràng buộc bản liên kết và lưu báo cáo sau khi xóa nhân viên.
- Browser tests: luồng cuối ngày, thêm task, xuất PNG, lưu/sửa, admin CRUD mẫu, desktop/mobile. Các kiểm tra này không thay thế bước kiểm thử Supabase thật và chia sẻ Zalo trên thiết bị thật sau triển khai.

## Cấu trúc

- `src/components/`: đăng nhập, nhập báo cáo, lịch sử, quản lý nhân viên, mẫu ảnh.
- `src/app/api/employees/route.ts`: API admin; secret key chỉ dùng phía server.
- `supabase/migrations/001_initial.sql`: bảng, trigger, RLS và ràng buộc dữ liệu.
- `scripts/create-admin.mjs`: tạo admin đầu tiên bằng terminal, mật khẩu nhập ẩn.
- `tests/`: kiểm tra luồng nghiệp vụ, database và trình duyệt.
- `docs/DESIGN.md`: quyết định thiết kế và nguồn skill.

Không commit `.env.local`, khóa Supabase hay dữ liệu công ty. `package-lock.json` khóa phiên bản dependency để `npm ci` cho kết quả ổn định.
