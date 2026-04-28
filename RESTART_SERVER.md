# Hướng Dẫn Khắc Phục Lỗi 404

## 🔧 Vấn Đề
Các API endpoints (`/api/proxy-image`, `/api/extract-audio`) trả về lỗi 404.

## ✅ Giải Pháp

### Bước 1: Dừng Server Hiện Tại
1. Trong terminal đang chạy server, nhấn `Ctrl+C` để dừng server

### Bước 2: Khởi Động Lại Server
Chạy lại lệnh:
```bash
python app.py
```

Hoặc nếu dùng virtual environment:
```bash
python -m flask run
```

### Bước 3: Kiểm Tra
Mở browser và test:
- `http://localhost:5000/api/proxy-image?url=https://example.com/image.jpg` (sẽ trả về error nhưng không phải 404)
- Xem console để đảm bảo không còn lỗi 404

## 📝 Lưu Ý
- Đảm bảo đã lưu tất cả file trước khi restart
- Nếu vẫn gặp lỗi, kiểm tra port có đúng không (5000)
- Nếu dùng Vercel, code sẽ tự động deploy sau khi push lên GitHub

## 🔍 Kiểm Tra Code
Các endpoints đã được thêm vào `app.py`:
- ✅ `/api/proxy-image` (dòng 487)
- ✅ `/api/extract-audio` (dòng 534)

Nếu vẫn gặp vấn đề, kiểm tra:
1. File `app.py` đã được lưu chưa
2. Server đã được restart chưa
3. Port có đúng không

