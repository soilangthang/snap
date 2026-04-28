# Giải Thích Về Các Nút Tải

## 📹 Tải SD vs HD

### SD (Standard Definition)
- **Chất lượng**: Thấp hơn, độ phân giải thường là 480p hoặc 720p
- **Kích thước file**: Nhỏ hơn (thường 5-15 MB)
- **Tốc độ tải**: Nhanh hơn
- **Dùng khi**: 
  - Kết nối internet chậm
  - Tiết kiệm dung lượng lưu trữ
  - Chỉ cần xem trên điện thoại

### HD (High Definition)
- **Chất lượng**: Cao hơn, độ phân giải 1080p hoặc cao hơn
- **Kích thước file**: Lớn hơn (thường 20-50 MB)
- **Tốc độ tải**: Chậm hơn một chút
- **Dùng khi**:
  - Kết nối internet tốt
  - Muốn chất lượng tốt nhất
  - Xem trên màn hình lớn

## 🎵 Tải MP3 (Audio Extraction)

### Tính năng
- Trích xuất chỉ phần âm thanh từ video TikTok
- Lưu dưới dạng file MP3
- Tiết kiệm dung lượng (chỉ âm thanh, không có hình ảnh)

### Trạng thái hiện tại
⚠️ **Tính năng đang được phát triển**

Hiện tại khi click nút "Download MP3", hệ thống sẽ hiển thị thông báo rằng tính năng này sắp ra mắt. 

**Lý do**:
- Trích xuất audio từ video cần xử lý phía server
- Cần thêm API endpoint để convert video → audio
- Cần cài đặt thư viện xử lý video (như FFmpeg)

**Giải pháp tạm thời**:
1. Tải video MP4 về
2. Sử dụng phần mềm converter (như VLC, Online-Convert) để chuyển sang MP3

### Kế hoạch phát triển
- [ ] Thêm API endpoint `/api/extract-audio`
- [ ] Tích hợp FFmpeg hoặc service tương tự
- [ ] Xử lý conversion phía server
- [ ] Hỗ trợ tải MP3 trực tiếp

## 🖼️ Tải Ảnh (Thumbnail/Cover Image)

### Tính năng
- Tải ảnh thumbnail/cover của video TikTok
- Lưu dưới dạng file JPG/PNG
- Kích thước nhỏ, tải nhanh

### Cách hoạt động
1. Khi video được load, hệ thống lấy URL của thumbnail từ TikTok API
2. Click nút "Download Image"
3. Hệ thống tải ảnh từ URL và lưu về máy
4. Tên file: `tiktok_{video_id}_thumbnail.jpg`

### Lưu ý
- Chỉ có thể tải ảnh sau khi đã load video thành công
- Nếu video không có thumbnail, nút sẽ hiển thị lỗi
- Ảnh được tải trực tiếp từ TikTok, không qua xử lý

## 🎯 So Sánh Các Tùy Chọn

| Tùy chọn | File Size | Chất lượng | Tốc độ | Mục đích |
|----------|-----------|------------|--------|----------|
| **SD** | Nhỏ (~10 MB) | Vừa phải | ⚡⚡⚡ Nhanh | Tiết kiệm data |
| **HD** | Lớn (~30 MB) | Cao | ⚡⚡ Chậm hơn | Chất lượng tốt |
| **MP3** | Rất nhỏ (~3 MB) | Chỉ âm thanh | ⚡⚡⚡ Nhanh | Nghe nhạc |
| **Image** | Rất nhỏ (~200 KB) | Ảnh tĩnh | ⚡⚡⚡⚡ Rất nhanh | Ảnh bìa |

## 💡 Khuyến Nghị Sử Dụng

### Cho người dùng Ấn Độ & Đông Nam Á:

1. **Kết nối chậm/Data hạn chế**: 
   - → Dùng **SD** hoặc **Image**

2. **Muốn chất lượng tốt**:
   - → Dùng **HD**

3. **Chỉ cần nhạc**:
   - → Dùng **MP3** (sắp có)

4. **Làm avatar/ảnh bìa**:
   - → Dùng **Image**

## 🔄 Quy Trình Tải

```
1. Dán link TikTok
   ↓
2. Click "Download MP4"
   ↓
3. Video được load và hiển thị preview
   ↓
4. Chọn chất lượng:
   - SD (nhỏ, nhanh)
   - HD (lớn, chất lượng cao)
   - MP3 (chỉ âm thanh - sắp có)
   - Image (ảnh thumbnail)
```

## 📝 Lưu Ý Kỹ Thuật

### SD và HD
- Cả hai đều là file MP4
- Chất lượng khác nhau do bitrate và resolution
- HD có thể không khả dụng cho tất cả video (tùy video gốc)

### MP3 Extraction
- Cần server-side processing
- Hiện tại: Placeholder (thông báo "coming soon")
- Tương lai: API endpoint để convert video → audio

### Image Download
- Tải trực tiếp từ TikTok CDN
- Không cần xử lý phía server
- Hoạt động ngay lập tức

## 🚀 Cải Tiến Tương Lai

1. **MP3 Extraction thực sự**
   - Backend API với FFmpeg
   - Progress bar cho conversion
   - Hỗ trợ nhiều format audio

2. **Tải nhiều ảnh**
   - Tải tất cả frames từ video
   - Tạo GIF từ video
   - Extract multiple thumbnails

3. **Compression Options**
   - Nén video để giảm kích thước
   - Custom quality settings
   - Preview trước khi tải

