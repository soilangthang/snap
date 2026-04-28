# Hướng Dẫn Google AdSense

## 📌 Lưu Ý Quan Trọng

Website hiện tại của bạn là **HTML thông thường**, không phải **AMP website**.

### Sự Khác Biệt:

1. **AMP Auto Ads** (mã bạn đã cung cấp):
   - Chỉ hoạt động trên **AMP pages**
   - Cần cấu trúc HTML theo chuẩn AMP
   - Sử dụng thư viện AMP Auto Ads

2. **Auto Ads Thông Thường** (đã được chèn):
   - Hoạt động trên **website HTML thông thường**
   - Không cần AMP
   - Tự động đặt quảng cáo

## 🔧 Mã Đã Được Chèn

### 1. Trong `<head>` (dòng 7-9):
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084835264788220"
 crossorigin="anonymous"></script>
```

### 2. Ngay sau `<body>` (dòng 41-45):
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084835264788220"
 crossorigin="anonymous"></script>
<script>
    (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

## 🎯 Cách Hoạt Động

**Auto Ads** sẽ tự động:
- Phân tích nội dung trang
- Chọn vị trí tốt nhất để đặt quảng cáo
- Hiển thị quảng cáo phù hợp
- Tối ưu vị trí để tăng revenue

## 📱 Nếu Muốn Sử Dụng AMP Auto Ads

Nếu bạn muốn tạo AMP version của website, cần:

1. Tạo file AMP HTML (ví dụ: `index.amp.html`)
2. Sử dụng cấu trúc AMP:
   ```html
   <!doctype html>
   <html ⚡ lang="en">
   <head>
       <meta charset="utf-8">
       <script async src="https://cdn.ampproject.org/v0.js"></script>
       <script async custom-element="amp-auto-ads"
               src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js"></script>
       ...
   </head>
   <body>
       <amp-auto-ads type="adsense"
                     data-ad-client="ca-pub-6084835264788220">
       </amp-auto-ads>
       ...
   </body>
   </html>
   ```

## ✅ Khuyến Nghị

**Sử dụng Auto Ads thông thường** (đã chèn):
- ✅ Đơn giản hơn
- ✅ Hoạt động ngay với website hiện tại
- ✅ Không cần chuyển đổi sang AMP
- ✅ Tự động tối ưu vị trí quảng cáo

## 🔍 Kiểm Tra

Sau khi deploy:
1. Đảm bảo website hoạt động
2. Đăng ký Google AdSense (nếu chưa)
3. Bật Auto Ads trong AdSense dashboard
4. Đợi 1-2 giờ để quảng cáo xuất hiện

## 📝 Lưu Ý

- Mã AdSense đã được chèn đúng vị trí
- Auto Ads sẽ tự động hoạt động sau khi được kích hoạt trong AdSense
- Không cần thêm code ad units riêng lẻ (Auto Ads tự động xử lý)
- Có thể mất đến 24 giờ để quảng cáo bắt đầu hiển thị

## ✅ Cập nhật đáp ứng "Nội dung có giá trị thấp" (Low-value content)

Để tăng cơ hội duyệt AdSense, dự án đã được cập nhật:

- **Chính sách bảo mật:** Mở rộng, thêm mục cookie/quảng cáo bên thứ ba (Google AdSense), thông tin liên hệ (contact@tik1s.com).
- **Điều khoản dịch vụ:** Mở rộng, thêm liên hệ và mục về dịch vụ bên thứ ba.
- **Trang About:** Thêm trang `/about` (giới thiệu Tik1s, sứ mệnh, quảng cáo, liên hệ).
- **FAQ:** Câu trả lời được mở rộng thành đoạn văn có nội dung (4 ngôn ngữ: EN, HI, VI, ID).
- **JSON-LD:** Thêm schema WebSite/Organization trên trang chủ để SEO và tin cậy.
- **Sitemap:** Thêm URL `/about`.

Sau khi chỉnh sửa xong, hãy đảm bảo email **contact@tik1s.com** hoạt động (hoặc thay bằng email thật trong `app.py` và `index.html` JSON-LD), rồi gửi **Yêu cầu xem xét** lại trong AdSense.

