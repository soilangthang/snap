# 📝 Hướng Dẫn Cập Nhật Sitemap.xml

## ✅ Đã Cập Nhật

### Sitemap.xml đã được cập nhật với:
1. ✅ Route `/blog` - Trang blog mới
2. ✅ Cập nhật lastmod date thành 2025-01-27
3. ✅ Điều chỉnh priority cho từng trang:
   - Homepage (`/`): Priority 1.0 (cao nhất)
   - Blog (`/blog`): Priority 0.8 (cao cho SEO)
   - Privacy/Terms: Priority 0.5 (trung bình)
4. ✅ Cập nhật changefreq phù hợp:
   - Homepage: daily (thay đổi hàng ngày)
   - Blog: weekly (thay đổi hàng tuần)
   - Legal pages: monthly (thay đổi hàng tháng)

## 🔄 Bước Tiếp Theo

### Sau Khi Deploy Lên Vercel:

1. **Lấy domain thực tế từ Vercel**
   - Vào Vercel Dashboard
   - Copy URL của project (ví dụ: `tiktok-downloader.vercel.app`)

2. **Cập nhật domain trong sitemap.xml**
   - Tìm và thay tất cả `your-domain.vercel.app`
   - Thay bằng domain thực tế của bạn
   
   ```xml
   <!-- Từ: -->
   <loc>https://your-domain.vercel.app/</loc>
   
   <!-- Thành: -->
   <loc>https://tiktok-downloader.vercel.app/</loc>
   ```

3. **Commit và Push**
   ```bash
   git add sitemap.xml
   git commit -m "Update sitemap.xml with actual domain"
   git push origin main
   ```

4. **Submit Sitemap Lên Google Search Console**
   - Đăng nhập Google Search Console
   - Vào "Sitemaps" section
   - Submit: `https://your-domain.vercel.app/sitemap.xml`

## 📋 Checklist

- [x] Sitemap.xml đã được cập nhật với route `/blog`
- [x] Priority và changefreq đã được điều chỉnh
- [x] Lastmod date đã được cập nhật
- [ ] Domain đã được thay thế sau khi deploy
- [ ] Sitemap đã được submit lên Google Search Console

## 🔍 Các Routes Trong Sitemap

1. **`/`** - Homepage
   - Priority: 1.0 (Cao nhất)
   - Changefreq: daily
   
2. **`/blog`** - Blog với 3 bài viết SEO
   - Priority: 0.8 (Cao cho SEO)
   - Changefreq: weekly
   
3. **`/privacy`** - Privacy Policy
   - Priority: 0.5
   - Changefreq: monthly
   
4. **`/terms`** - Terms of Service
   - Priority: 0.5
   - Changefreq: monthly

## ⚠️ Lưu Ý

- **Không cần thêm** static files (CSS, JS) vào sitemap
- **Không cần thêm** API endpoints vào sitemap
- **Chỉ thêm** các trang HTML công khai và quan trọng cho SEO
- **Cập nhật lastmod** khi có thay đổi nội dung

## 📚 Tài Liệu Tham Khảo

- [Sitemap Protocol](https://www.sitemaps.org/protocol.html)
- [Google Search Console - Submit Sitemap](https://support.google.com/webmasters/answer/183668)

