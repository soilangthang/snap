# TikTok Downloader - Tải Video Không Watermark

Web tool hiện đại để tải video TikTok chất lượng cao, không có watermark. Được tối ưu cho production và sẵn sàng deploy lên Vercel.

## ✨ Tính năng

- 🎬 **Chất lượng cao**: Tải video ở chất lượng gốc
- ✨ **Không watermark**: Video sạch, không có logo TikTok
- ⚡ **Tải nhanh**: Quá trình đơn giản, nhanh chóng
- 📊 **Progress bar**: Hiển thị % tiến trình tải
- 📱 **Responsive**: Hoạt động tốt trên mọi thiết bị
- 🔒 **Bảo mật**: Rate limiting và input validation
- 🌐 **SEO Optimized**: Tối ưu cho Google AdSense

## 🚀 Cài đặt Local

1. Cài đặt Python 3.9 trở lên

2. Cài đặt các thư viện cần thiết:
```bash
pip install -r requirements.txt
```

3. Chạy ứng dụng:
```bash
python app.py
```

4. Mở trình duyệt và truy cập: `http://localhost:5000`

## 📦 Deploy Lên Vercel

Xem file [DEPLOY.md](./DEPLOY.md) để biết hướng dẫn chi tiết.

### Các bước nhanh:

1. Push code lên GitHub
2. Import project vào Vercel
3. Vercel sẽ tự động detect và deploy
4. Cập nhật domain trong các file:
   - `index.html`
   - `robots.txt`
   - `sitemap.xml`

## 📋 Yêu Cầu Google AdSense

Website đã được tối ưu để đáp ứng yêu cầu Google AdSense:

✅ **SEO Optimization**
- Meta tags đầy đủ
- Structured data (JSON-LD)
- Sitemap và robots.txt
- Canonical URLs

✅ **Nội Dung Chất Lượng**
- Privacy Policy
- Terms of Service
- Footer với links
- Nội dung rõ ràng, hữu ích

✅ **Technical Requirements**
- Responsive design
- Fast loading
- Error handling
- Security measures

## 🛠️ Công nghệ sử dụng

- **Backend**: Flask (Python)
- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Deployment**: Vercel
- **API**: TikTok API công khai

## 📁 Cấu trúc Project

```
.
├── app.py              # Flask application
├── index.html          # Frontend HTML
├── style.css           # Styles
├── script.js           # Frontend logic
├── requirements.txt    # Python dependencies
├── vercel.json         # Vercel configuration
├── robots.txt          # SEO robots file
├── sitemap.xml         # SEO sitemap
├── DEPLOY.md           # Deployment guide
└── README.md           # This file
```

## 🔧 Cấu hình

### Environment Variables (Nếu cần)

Có thể thêm vào Vercel Dashboard:
- `PYTHON_VERSION`: Python version (mặc định: 3.9)

## 📝 License

MIT License

## ⚠️ Lưu Ý

- Đảm bảo thay đổi domain trong các file trước khi deploy
- Website cần hoạt động ổn định trước khi đăng ký AdSense
- Tuân thủ quy định bản quyền khi sử dụng video đã tải

## 🤝 Đóng Góp

Mọi đóng góp đều được chào đón! Vui lòng tạo issue hoặc pull request.

## 📧 Liên Hệ

Nếu có câu hỏi hoặc vấn đề, vui lòng tạo issue trên GitHub.

---

**Made with ❤️ for TikTok users**
