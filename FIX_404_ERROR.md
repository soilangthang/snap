# 🔧 Khắc Phục Lỗi 404 cho MP3 và Image Download

## ❌ Vấn Đề
Console hiển thị lỗi 404 cho các endpoints:
- `/api/proxy-image` - Lỗi 404
- `/api/extract-audio` - Lỗi 404

## ✅ Nguyên Nhân
Server đang chạy với **code cũ** chưa có các API endpoints mới.

## 🚀 Giải Pháp

### Cách 1: Restart Server (Khuyên Dùng)

1. **Dừng server hiện tại:**
   - Tìm terminal/command prompt đang chạy server
   - Nhấn `Ctrl+C` để dừng

2. **Khởi động lại server:**
   ```bash
   python app.py
   ```

3. **Kiểm tra lại:**
   - Refresh trang web
   - Thử download MP3 hoặc Image lại
   - Kiểm tra console (F12) - không còn lỗi 404

### Cách 2: Nếu Server Tự Động Reload

Nếu bạn đang dùng Flask với `debug=True` (auto-reload):
1. Lưu file `app.py` lại (Ctrl+S)
2. Flask sẽ tự động reload
3. Refresh trang web

### Cách 3: Kiểm Tra Code

Đảm bảo các endpoints này có trong `app.py`:

```python
@app.route('/api/proxy-image', methods=['GET'])  # Dòng 487
@app.route('/api/extract-audio', methods=['POST'])  # Dòng 534
```

## 📋 Kiểm Tra Sau Khi Restart

1. **Test Proxy Image:**
   - Mở: `http://localhost:5000/api/proxy-image?url=https://example.com/test.jpg`
   - Phải trả về error JSON (không phải 404 HTML)

2. **Test Extract Audio:**
   - Sử dụng Postman hoặc curl để test
   - Hoặc đơn giản: refresh trang và thử download MP3

3. **Kiểm Tra Console:**
   - Mở Developer Tools (F12)
   - Xem tab Console
   - Không còn lỗi 404

## ✅ Kết Quả Mong Đợi

Sau khi restart:
- ✅ Nút "Download MP3" hoạt động
- ✅ Nút "Download Image" hoạt động  
- ✅ Không còn lỗi 404 trong console
- ✅ API endpoints trả về đúng response

## 🆘 Nếu Vẫn Gặp Lỗi

1. Kiểm tra file `app.py` đã được lưu chưa
2. Kiểm tra port server (mặc định: 5000)
3. Xem terminal có error messages không
4. Đảm bảo Flask và các dependencies đã được cài đặt:
   ```bash
   pip install -r requirements.txt
   ```

