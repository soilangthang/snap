# Hướng Dẫn Deploy Lên Vercel

## Yêu Cầu
- Tài khoản GitHub
- Tài khoản Vercel (miễn phí)

## Các Bước Deploy

### 1. Chuẩn Bị Code

**QUAN TRỌNG**: Trước khi deploy, cần cập nhật domain trong các file sau:

1. **index.html** - Tìm và thay thế `your-domain.vercel.app`:
   ```html
   <!-- Tìm các dòng có your-domain.vercel.app và thay bằng domain thực tế -->
   <meta property="og:url" content="https://YOUR-DOMAIN.vercel.app/">
   <link rel="canonical" href="https://YOUR-DOMAIN.vercel.app/">
   ```

2. **robots.txt** - Thay `your-domain.vercel.app`:
   ```
   Sitemap: https://YOUR-DOMAIN.vercel.app/sitemap.xml
   ```

3. **sitemap.xml** - Thay tất cả `your-domain.vercel.app`:
   ```xml
   <loc>https://YOUR-DOMAIN.vercel.app/</loc>
   ```

**Lưu ý**: Bạn có thể deploy trước, sau đó quay lại cập nhật domain sau khi có URL thực tế từ Vercel.

### 2. Push Code Lên GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main
```

### 3. Deploy Lên Vercel

#### Cách 1: Qua Vercel Dashboard
1. Đăng nhập vào [Vercel](https://vercel.com)
2. Click "New Project"
3. Import repository từ GitHub
4. Vercel sẽ tự động detect Python và cấu hình
5. Click "Deploy"

#### Cách 2: Qua Vercel CLI
```bash
npm i -g vercel
vercel login
vercel
```

### 4. Cấu Hình Environment Variables (Nếu cần)
- Vào Project Settings > Environment Variables
- Thêm các biến môi trường nếu cần

### 5. Kiểm Tra Deployment
- Sau khi deploy, Vercel sẽ cung cấp URL
- Kiểm tra các route:
  - `/` - Trang chủ
  - `/privacy` - Chính sách bảo mật
  - `/terms` - Điều khoản sử dụng
  - `/robots.txt` - Robots.txt
  - `/sitemap.xml` - Sitemap

## Lưu Ý Quan Trọng

### Để Google AdSense Chấp Nhận:

1. **Cập Nhật Domain**
   - Thay tất cả `your-domain.vercel.app` bằng domain thực tế của bạn
   - Có thể dùng domain miễn phí từ Vercel hoặc domain riêng

2. **Thêm Nội Dung Chất Lượng**
   - Đảm bảo trang có đủ nội dung (đã có)
   - Thêm Privacy Policy và Terms of Service (đã có)

3. **SEO Optimization**
   - Meta tags đã được thêm
   - Structured data đã được thêm
   - Sitemap và robots.txt đã được tạo

4. **Tuân Thủ Chính Sách AdSense**
   - Không có nội dung vi phạm
   - Có đủ nội dung chất lượng
   - Có Privacy Policy và Terms of Service
   - Website hoạt động tốt và responsive

5. **Sau Khi Deploy**
   - Đăng ký Google AdSense
   - Đảm bảo website đã hoạt động ổn định ít nhất vài ngày
   - Đảm bảo có traffic thực tế

## Troubleshooting

### Lỗi Build
- Kiểm tra `requirements.txt` có đầy đủ dependencies
- Kiểm tra Python version trong `vercel.json`

### Lỗi Runtime
- Kiểm tra logs trong Vercel Dashboard
- Đảm bảo tất cả routes được cấu hình đúng trong `vercel.json`

### Static Files Không Load
- Đảm bảo routes cho CSS/JS được cấu hình trong `vercel.json`
- Kiểm tra file paths

## Tối Ưu Performance

1. **Enable Caching**
   - Vercel tự động cache static files
   - Có thể thêm cache headers trong code

2. **Optimize Images**
   - Sử dụng WebP format
   - Lazy loading cho images

3. **Minify Assets**
   - CSS và JS đã được tối ưu
   - Có thể thêm minification nếu cần

## Bảo Mật

- Rate limiting đã được thêm
- Input validation đã được thêm
- CORS đã được cấu hình
- Error handling đã được cải thiện

## Support

Nếu gặp vấn đề, kiểm tra:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)

