# Hướng Dẫn Chèn Mã AMP Auto Ads

## ⚠️ Lưu Ý Quan Trọng

**Website hiện tại của bạn là HTML thông thường, KHÔNG phải AMP website.**

Mã AMP Auto Ads bạn cung cấp **chỉ hoạt động trên AMP pages**.

## 🔍 So Sánh

### Website Hiện Tại (HTML Thông Thường)
- ✅ **Đã chèn**: Auto Ads thông thường (hoạt động ngay)
- ❌ **Không cần**: AMP Auto Ads (vì không phải AMP)

### Nếu Muốn Dùng AMP Auto Ads
- Cần tạo **AMP version** của website
- Sử dụng cấu trúc HTML theo chuẩn AMP
- Chèn mã AMP Auto Ads như hướng dẫn

## 📝 Mã AMP Auto Ads (Để Tham Khảo)

Nếu bạn muốn tạo AMP version sau này, sử dụng mã sau:

### Bước 1: Trong `<head>`
```html
<script async custom-element="amp-auto-ads"
        src="https://cdn.ampproject.org/v0/amp-auto-ads-0.1.js">
</script>
```

### Bước 2: Ngay sau thẻ `<body>`
```html
<amp-auto-ads type="adsense"
              data-ad-client="ca-pub-6084835264788220">
</amp-auto-ads>
```

## ✅ Mã Đã Được Chèn (Auto Ads Thông Thường)

Website hiện tại đã có **Auto Ads thông thường** (hoạt động tốt):

### 1. Trong `<head>` (dòng 7-9):
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084835264788220"
 crossorigin="anonymous"></script>
```

### 2. Ngay sau `<body>` (dòng 43-47):
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6084835264788220"
 crossorigin="anonymous"></script>
<script>
    (adsbygoogle = window.adsbygoogle || []).push({});
</script>
```

## 🎯 Khuyến Nghị

**Sử dụng Auto Ads thông thường** (đã chèn):
- ✅ Hoạt động ngay với website hiện tại
- ✅ Không cần chuyển đổi sang AMP
- ✅ Tự động tối ưu vị trí quảng cáo
- ✅ Đơn giản và hiệu quả

**Chỉ tạo AMP version nếu**:
- Bạn muốn tăng tốc độ tải trang
- Bạn muốn xuất hiện trong Google AMP cache
- Bạn có nguồn lực để maintain 2 versions (HTML và AMP)

## 📱 Cách Tạo AMP Version (Nếu Cần)

1. Tạo file `index.amp.html`
2. Sử dụng cấu trúc AMP HTML
3. Chèn mã AMP Auto Ads như hướng dẫn trên
4. Deploy cả 2 versions (HTML và AMP)

## ✅ Kết Luận

Website hiện tại **đã sẵn sàng** với Auto Ads thông thường. Mã AMP Auto Ads đã được comment trong code để tham khảo nếu bạn muốn tạo AMP version sau này.

