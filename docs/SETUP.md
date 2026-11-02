# Thiết lập MARIXA Report

Mã nguồn: https://github.com/KhangDepZai1802/Marixa_REPORT

## 1. Tạo Supabase

1. Mở [Supabase Dashboard](https://supabase.com/dashboard), đăng nhập, tạo organization và **New project**.
2. Đặt tên `marixa-report`. Chọn khu vực gần Việt Nam nếu có (ví dụ Singapore), đặt mật khẩu database mạnh và lưu trong trình quản lý mật khẩu. Mật khẩu database khác mật khẩu admin ứng dụng.
3. Có thể bắt đầu bằng gói Free. GitHub optional để trống. Giữ **Enable Data API** bật; bỏ chọn **Automatically expose new tables**, vì migration cấp quyền cụ thể. **Enable automatic RLS** có thể tắt, migration bật RLS cho hai bảng ứng dụng. Kiểm tra [giới hạn gói](https://supabase.com/pricing) trước vận hành; dự án miễn phí có thể tạm dừng do ít hoạt động. Ứng dụng không cần Supabase Storage vì ảnh được tạo trên thiết bị.
4. Chờ project sẵn sàng. Vào **SQL Editor → New query**. Mở `supabase/migrations/001_initial.sql` trong kho GitHub, sao chép toàn bộ nội dung, bấm **Run**. Chạy một lần trên dự án mới; không chạy lại nếu các bảng đã tồn tại.
5. Kiểm tra Table Editor có `profiles` và `reports`; cả hai đã bật RLS. Không tắt RLS.
6. Vào **Authentication → Sign In / Providers** (hoặc mục cấu hình tương đương), **tắt Allow new users to sign up**. Chỉ admin tạo tài khoản qua API; public signup không được dùng.
7. Ứng dụng ánh xạ **tên đăng nhập** sang địa chỉ định danh kỹ thuật `@login.marixa.invalid`, không phải hộp thư. Tên đăng nhập được lưu trong Auth app_metadata và được bảo đảm duy nhất qua email kỹ thuật. Đổi họ tên/phòng ban không làm đổi tên đăng nhập. Admin cập nhật bằng `auth.admin.updateUserById`; không cần thay đổi cài đặt Secure email change.
8. Giữ các giới hạn đăng nhập của Supabase Auth. Đặt **Minimum password length** bằng **6** trong cấu hình Email provider để khớp ứng dụng; admin cấp lại khi nhân viên quên.

## 2. Lấy khóa và cấu hình máy

Trong project, tìm **Connect / Project Settings → API Keys** và URL project. Tên menu có thể thay đổi theo dashboard.

| Biến môi trường                        | Giá trị                                                     | Nơi dùng                             |
| -------------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`             | URL project dạng `https://…supabase.co`                     | Trình duyệt + server                 |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key (`sb_publishable_…`) hoặc legacy `anon` key | Trình duyệt, bảo vệ dữ liệu bằng RLS |
| `SUPABASE_SECRET_KEY`                  | Secret key (`sb_secret_…`)                                  | Chỉ server và script tạo admin       |

1. Trong thư mục dự án, sao chép `.env.example` thành `.env.local`:

```powershell
Copy-Item .env.example .env.local
```

2. Điền ba giá trị vào `.env.local`. Không dán khóa bí mật vào chat, không đưa vào GitHub và không đặt tiền tố `NEXT_PUBLIC_` cho secret key.
3. Chạy `npm.cmd ci` nếu chưa cài dependency.
4. Nếu dev server đang chạy, dừng bằng Ctrl+C rồi chạy `npm.cmd run dev` để đọc cấu hình mới.

## 3. Tạo admin đầu tiên

Sau khi chạy SQL và điền `.env.local`:

```powershell
npm.cmd run admin:create
```

Nhập họ tên admin, Enter; script gợi ý tên đăng nhập dạng `tên.họ`, bấm Enter để nhận gợi ý hoặc nhập tên khác. Tiếp theo nhập mật khẩu 6–128 ký tự và Enter. Mật khẩu không hiện trên màn hình. Chạy trong terminal tương tác của máy, không qua command arguments. Script tạo Supabase Auth user và trigger tự tạo hồ sơ admin thuộc phòng IT.

Mở http://127.0.0.1:3000 → chọn **Admin** → nhập **tên đăng nhập** và mật khẩu vừa tạo. Không dùng họ tên hoặc email kỹ thuật ở ô đăng nhập. Tên đăng nhập không phân biệt chữ hoa/thường và bỏ khoảng trắng ở hai đầu.

Vào **Nhân viên → Thêm nhân viên**: nhập họ tên, xem/sửa tên đăng nhập tự gợi ý, chọn phòng ban và đặt mật khẩu. Ví dụ Nguyễn Minh Anh → `anh.nguyen`; nếu trùng sẽ thêm phòng ban như `anh.nguyen.it` hoặc `anh.nguyen.mkt`, rồi thêm số nếu vẫn trùng. Họ tên đầy đủ không cần thêm mã phân biệt. Nhân viên chọn đúng phòng ban rồi nhập tên đăng nhập và mật khẩu; họ tên trên báo cáo tự điền từ hồ sơ.

Đổi mật khẩu nhân viên: bấm Sửa, điền mật khẩu mới. Để trống nếu giữ nguyên. Không thể xem mật khẩu cũ. Admin không bị xóa từ màn quản lý nhân viên.

## 4. Đưa lên Vercel

**Chọn gói trước:** Vercel Hobby được công bố cho mục đích cá nhân, phi thương mại. MARIXA Report phục vụ công ty, nên không mặc định hợp lệ với Hobby. Chọn gói phù hợp hoặc trao đổi với Vercel trước khi sử dụng chính thức. Mã nguồn tương thích Vercel; chưa mua hoặc kích hoạt gói trả phí tự động.

1. Đăng nhập [Vercel](https://vercel.com/new) bằng GitHub.
2. **Add New → Project → Import Git Repository**. Chọn `KhangDepZai1802/Marixa_REPORT` (có thể cần cấp quyền cho Vercel truy cập riêng kho này).
3. Framework preset: **Next.js**. Root Directory: để gốc. Build command: `npm run build`. Output Directory: mặc định Next.js. Node.js: **22.x**.
4. Thêm **ba biến môi trường** đúng tên trong bảng phía trên. Không đặt secret key vào biến public. Chỉ cấu hình cho môi trường cần dùng; không đưa database thật vào preview không tin cậy.
5. Bấm **Deploy**, chờ build xong và mở URL HTTPS do Vercel cấp. Không có URL production cho tới khi thực hiện bước này.
6. Trong Supabase **Authentication → URL Configuration**, đặt Site URL bằng URL Vercel chính thức. Ứng dụng dùng mật khẩu, không phụ thuộc email redirect, nhưng vẫn nên cấu hình đúng domain.
7. Đăng nhập admin đã tạo. Tài khoản và dữ liệu nằm ở Supabase nên dùng chung với máy local nếu cùng project.
8. Những lần push vào `main` tiếp theo sẽ được Vercel triển khai tự động khi integration đã bật. Nếu thay đổi biến môi trường public, phải **Redeploy** vì chúng được đóng gói lúc build.

## 5. Kiểm tra trước khi dùng chính thức

- Tạo hai nhân viên ở hai phòng ban. Nhân viên A lưu đầu ngày; nhân viên B không thấy và không sửa được báo cáo A. Admin nhìn thấy cả hai nhưng chỉ sửa báo cáo của chính admin.
- A mở bản đầu ngày → Báo cáo cuối ngày → sửa tiến độ/ghi chú, thêm task mới, nhập KPI và lưu. Bản đầu ngày vẫn giữ nội dung cũ. Bấm lại mở bản cuối ngày đang có.
- Sửa, tải PNG và thử báo cáo có nội dung dài. Ảnh cần hiển thị đầy đủ dấu tiếng Việt và không cắt mất nhiệm vụ.
- Trên Android/iPhone thật: bấm Chia sẻ ảnh → Chọn ứng dụng → chọn Zalo nếu hệ điều hành hiển thị. Website không tự gửi tin, không chọn được người nhận thay bạn. Nếu Zalo không hiện, tải PNG rồi mở Zalo gửi thủ công.
- Admin đổi họ tên/phòng ban, kiểm tra tên đăng nhập vẫn giữ nguyên và đăng nhập với đúng phòng ban mới. Thử sửa riêng tên đăng nhập; tên mới đăng nhập được, tên cũ không còn dùng được sau khi đổi. Xóa nhân viên kiểm tra không đăng nhập được; báo cáo cũ vẫn còn cho admin.
- Mất mạng: ứng dụng báo lỗi lưu; không hiển thị đã lưu thành công. Bản đang nhập chỉ giữ trong bộ nhớ tab, chưa có tự lưu nháp; đóng/tải lại trang có thể mất nội dung chưa lưu.

## Các quyết định hiện tại

- Một báo cáo đầu ngày và một báo cáo cuối ngày cho mỗi người/ngày, múi giờ Việt Nam.
- Cuối ngày bắt buộc liên kết bản đầu ngày đã lưu. Ngày, loại và liên kết không đổi sau khi lưu; nội dung được sửa/xóa theo quyền sở hữu.
- KPI hiện là một chỉ số tùy chọn mỗi báo cáo; hỗ trợ số thập phân và kết quả vượt 100%.
- Danh sách phòng ban được cấu hình trong `src/lib/model.ts`. Chưa có chức năng quản trị phòng ban riêng.
- Mật khẩu và session do Supabase Auth quản lý. Ảnh xuất tại trình duyệt; không tạo đường link báo cáo công khai.
- Khi xóa người dùng, báo cáo lưu tên/phòng ban tại lúc tạo. Không có tự động gửi email hay Zalo.

## Tài liệu chính thức

- [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase Admin createUser](https://supabase.com/docs/reference/javascript/auth-admin-createuser)
- [Supabase Admin updateUserById](https://supabase.com/docs/reference/javascript/auth-admin-updateuserbyid)
- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share)
