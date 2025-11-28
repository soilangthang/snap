# Quick Start Guide

## Deploy Nhanh Lên Vercel (5 phút)

### Bước 1: Chuẩn Bị
```bash
# Đảm bảo đã cài Git
git --version

# Clone hoặc tạo repo mới
git init
git add .
git commit -m "Initial commit"
```

### Bước 2: Push Lên GitHub
```bash
# Tạo repo mới trên GitHub, sau đó:
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

### Bước 3: Deploy Lên Vercel

**Cách 1: Qua Web (Khuyên dùng)**
1. Vào https://vercel.com
2. Đăng nhập bằng GitHub
3. Click "Add New Project"
4. Chọn repository vừa push
5. Vercel tự động detect Python
6. Click "Deploy"
7. Đợi 2-3 phút

**Cách 2: Qua CLI**
```bash
npm i -g vercel
vercel login
vercel
```

### Bước 4: Cập Nhật Domain

Sau khi deploy, Vercel sẽ cung cấp URL dạng: `your-project.vercel.app`

Cập nhật domain trong:
1. `index.html` - Tìm `your-domain.vercel.app` → thay bằng URL thực tế
2. `robots.txt` - Tìm `your-domain.vercel.app` → thay bằng URL thực tế  
3. `sitemap.xml` - Tìm `your-domain.vercel.app` → thay bằng URL thực tế

Sau đó commit và push lại:
```bash
git add .
git commit -m "Update domain"
git push
```

Vercel sẽ tự động redeploy.

### Bước 5: Kiểm Tra

Truy cập các URL sau để kiểm tra:
- `https://your-project.vercel.app/` - Trang chủ
- `https://your-project.vercel.app/privacy` - Privacy Policy
- `https://your-project.vercel.app/terms` - Terms of Service
- `https://your-project.vercel.app/robots.txt` - Robots.txt
- `https://your-project.vercel.app/sitemap.xml` - Sitemap

## Đăng Ký Google AdSense

### Yêu Cầu Trước Khi Đăng Ký:

1. ✅ Website đã hoạt động ổn định (ít nhất 1-2 tuần)
2. ✅ Có traffic thực tế
3. ✅ Đã cập nhật domain trong tất cả files
4. ✅ Privacy Policy và Terms đã có
5. ✅ Website responsive và load nhanh

### Các Bước Đăng Ký:

1. Vào https://www.google.com/adsense
2. Click "Get Started"
3. Nhập URL website
4. Chọn quốc gia
5. Điền thông tin
6. Submit và chờ duyệt (thường 1-2 tuần)

### Tips Để Được Duyệt:

- Đảm bảo website có nội dung chất lượng
- Không có nội dung vi phạm
- Có đủ trang (Home, Privacy, Terms)
- Website hoạt động tốt, không lỗi
- Có traffic thực tế từ người dùng

## Troubleshooting

### Lỗi Build Failed
- Kiểm tra `requirements.txt` có đầy đủ
- Kiểm tra Python version trong `vercel.json`

### CSS/JS Không Load
- Kiểm tra routes trong `vercel.json`
- Kiểm tra file paths

### API Không Hoạt Động
- Kiểm tra logs trong Vercel Dashboard
- Kiểm tra CORS settings

## Support

- Vercel Docs: https://vercel.com/docs
- Vercel Community: https://github.com/vercel/vercel/discussions

