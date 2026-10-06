<div align="center">

# 📚 StudyHome — Ứng dụng đặt phòng học

Đặt phòng học theo ca, nhanh – gọn – đẹp. Xây dựng bằng **React Native (Expo) + TypeScript + Firebase**.

</div>

<p align="center">
  <img src="docs/screenshots/01-home.png" width="260" alt="Trang chủ" />
  &nbsp;&nbsp;
  <img src="docs/screenshots/02-profile.png" width="260" alt="Cá nhân" />
</p>

---

## 🔑 Tài khoản dùng thử

> ⚠️ Các tài khoản chỉ hoạt động khi app kết nối tới **project Firebase của tác giả** (xem mục *Cấu hình Firebase*). Nếu bạn dùng project Firebase riêng thì cần tự tạo tài khoản như hướng dẫn ở mục *Tạo admin đầu tiên*.

| Vai trò | Email | Mật khẩu | Dùng để thử |
|---|---|---|---|
| **Quản trị viên (admin)** | `dung@vku.udn.vn` | `180905` | Tab **Quản lý**: tạo / sửa / xoá phòng, thêm ca, chọn ngày mở phòng trên lịch, xem & huỷ lượt đặt, tạo người dùng |
| Sinh viên | tự đăng ký trong app | — | Chọn vai trò **Sinh viên** ở màn hình đăng ký |
| Giảng viên | tự đăng ký trong app | — | Chọn vai trò **Giảng viên** — được **ưu tiên** khi ca đã đầy |

Admin cũng có thể tạo tài khoản sinh viên / giảng viên trong **Quản lý → Tài khoản**.

---

## ✨ Tính năng

| Nhóm | Chi tiết |
|---|---|
| **Xem & tìm phòng** | Danh sách phòng dạng lưới có ảnh, tên, vị trí, số chỗ, nhãn trạng thái; banner phòng nổi bật; tìm kiếm tức thì theo tên / vị trí |
| **Lọc nhiều tham số** | Ngày (14 ngày) · trạng thái (tất cả / còn trống / hết chỗ) · kích cỡ (≤10, 11–30, >30 chỗ) · sắp xếp (tên, nhiều ca trống, nhiều chỗ nhất) · phòng yêu thích |
| **Đặt phòng** | Chọn ngày → chọn một hoặc nhiều ca → xác nhận. Mỗi ca có sức chứa riêng (ví dụ 10 người), hiển thị "Còn x chỗ" và thanh tiến độ |
| **Xử lý đặt trùng** | Hai người cùng bấm vào chỗ cuối cùng: ai được server xử lý trước thì có chỗ, người còn lại nhận "Hết chỗ". Một người không đặt trùng một ca |
| **Ưu tiên giảng viên** | Ca đã đầy mà có sinh viên → giảng viên vẫn đặt được, sinh viên đặt sau cùng bị nhường chỗ và nhận thông báo trong app |
| **Phòng đã đặt** | Hai tab *Sắp tới / Đã qua*, xem chi tiết, huỷ lượt đặt |
| **Cá nhân** | Đổi ảnh đại diện, tên, năm sinh, mật khẩu, đăng xuất |
| **Quản trị** | CRUD phòng (xoá phòng kéo theo xoá ca + lượt đặt), quản lý ca từng phòng, **chọn ngày mở phòng bằng lịch**, khoá bảo trì, tạo người dùng, xem lượt đặt lọc theo ngày & phòng |
| **Giao diện** | Tông kem + vàng, animation mượt: thẻ hiện lần lượt, nhấn nảy, tim nảy, parallax ảnh phòng, bảng trượt từ dưới lên, khung xám khi tải, thanh tab nổi |

### Luật đặt phòng
1. Mỗi ca chứa tối đa `seats` người (số chỗ của phòng).
2. Còn chỗ → **ai đặt trước được trước**.
3. Ca đầy → **giảng viên** được lấy chỗ của **sinh viên đặt sau cùng**; giảng viên không đẩy giảng viên, sinh viên không đẩy ai.
4. Chỉ đặt được những ngày admin đã mở cho phòng đó.

---

## 🧰 Công nghệ

| Mục | Công nghệ |
|---|---|
| Nền tảng | React Native 0.86 · Expo (managed) |
| Ngôn ngữ | TypeScript `strict` |
| Điều hướng | React Navigation 7 — Native Stack + Bottom Tabs (params có kiểu) |
| State | Zustand 5 (người dùng, bộ lọc, yêu thích có lưu máy) · TanStack Query 5 (dữ liệu server) |
| Backend | Firebase 11 — Authentication (email/mật khẩu) + Cloud Firestore |
| Animation | `Animated` của React Native (không cần thư viện native thêm) |

---

## 🚀 Chạy dự án

**Yêu cầu:** Node.js 18+, ứng dụng **Expo Go** trên điện thoại.

```bash
npm install
npx expo install @expo/vector-icons    
cp .env.example .env                  
npx expo start -c
```

Quét mã QR bằng Expo Go (hoặc bấm `r` để tải lại).

### Cấu hình Firebase
1. Vào [Firebase Console](https://console.firebase.google.com) → tạo project.
2. Bật **Authentication → Email/Password** và **Firestore Database**. *(Ảnh được lưu trực tiếp trong Firestore dạng base64 nên không cần Storage.)*
3. Project settings → *Your apps* → thêm **Web app** → copy cấu hình vào `.env`:
   ```
   EXPO_PUBLIC_FB_API_KEY=
   EXPO_PUBLIC_FB_AUTH_DOMAIN=
   EXPO_PUBLIC_FB_PROJECT_ID=
   EXPO_PUBLIC_FB_STORAGE_BUCKET=
   EXPO_PUBLIC_FB_APP_ID=
   ```
4. Firestore → **Rules** → dán toàn bộ nội dung `firestore.rules` → **Publish**.

> 🔒 File `.env` **không** được đưa lên Git (đã có trong `.gitignore`).

### Tạo admin đầu tiên
Đăng ký một tài khoản trong app → Firestore → `users/<uid>` → sửa trường `role` thành `admin` → đăng nhập lại. Trong tab **Quản lý** bấm **+ Thêm phòng mới**, điền tên / vị trí / ảnh / số chỗ, chọn ngày mở và bấm **Tạo 5 ca mặc định**.

---

## 🧪 Kịch bản thử nhanh

1. **Admin** đăng nhập → Quản lý → thêm phòng, chọn ngày mở trên lịch, tạo ca → Lưu.
2. Đăng xuất, đăng ký **sinh viên A** → Trang chủ → tìm phòng, thử bộ lọc → vào phòng → chọn ca → **Xác nhận đặt**.
3. Đăng ký thêm sinh viên B, C… đặt cùng một ca cho tới khi đầy (thanh tiến độ chuyển đỏ, hiện "Hết chỗ").
4. Đăng ký **giảng viên** → vào ca đầy → ca hiện **"Ưu tiên GV"** → đặt → sinh viên đặt sau cùng nhận thông báo ở tab *Phòng đã đặt*.
5. **Admin** → Quản lý → tab *Lịch đặt* → lọc theo ngày / phòng, huỷ lượt đặt.

---

## 🗂️ Cấu trúc

```
studyhome/
├── App.tsx                # providers, điều hướng, kiểm tra đăng nhập
├── firestore.rules        # luật bảo mật
├── src/
│   ├── api.ts             # toàn bộ lời gọi Firebase
│   ├── firebase.ts        # khởi tạo Firebase
│   ├── hooks.ts           # hook TanStack Query
│   ├── store.ts           # Zustand
│   ├── types.ts           # kiểu dữ liệu + params điều hướng
│   ├── util.ts            # hàm ngày, trạng thái phòng
│   ├── ui.tsx             # màu sắc + thành phần giao diện có animation
│   ├── calendar.tsx       # lịch chọn nhiều ngày
│   ├── components/        # RoomCard, FeaturedCarousel, FilterSheet, TabBar, UpcomingCard
│   └── screens/           # Login, Browse, RoomDetail, MyBookings, Profile, Admin
└── docs/                  # báo cáo + ảnh chụp màn hình
```

Kiểm tra kiểu: `npm run tsc` (strict, không lỗi).





