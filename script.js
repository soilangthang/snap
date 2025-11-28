const tiktokUrlInput = document.getElementById('tiktokUrl');
const downloadBtn = document.getElementById('downloadBtn');
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const downloadLink = document.getElementById('downloadLink');
const copyLinkBtn = document.getElementById('copyLinkBtn');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressSize = document.getElementById('progressSize');
const progressSpeed = document.getElementById('progressSpeed');

let currentVideoUrl = '';
let downloadStartTime = 0;
let lastLoaded = 0;
let lastTime = 0;

// Xử lý khi nhấn nút tải
downloadBtn.addEventListener('click', handleDownload);

// Xử lý khi nhấn Enter
tiktokUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleDownload();
    }
});

// Xử lý sao chép link
copyLinkBtn.addEventListener('click', () => {
    if (currentVideoUrl) {
        navigator.clipboard.writeText(currentVideoUrl).then(() => {
            const originalText = copyLinkBtn.innerHTML;
            copyLinkBtn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Đã Sao Chép!
            `;
            setTimeout(() => {
                copyLinkBtn.innerHTML = originalText;
            }, 2000);
        }).catch(() => {
            showError('Không thể sao chép link');
        });
    }
});

async function handleDownload() {
    const url = tiktokUrlInput.value.trim();
    
    // Validate URL
    if (!url) {
        showError('Vui lòng nhập URL TikTok');
        return;
    }
    
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
        showError('URL không hợp lệ. Vui lòng nhập link TikTok');
        return;
    }
    
    // Ẩn kết quả và lỗi cũ
    resultSection.style.display = 'none';
    errorMessage.style.display = 'none';
    
    // Hiển thị loading
    setLoading(true);
    
    try {
        const response = await fetch('/api/download', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: url })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentVideoUrl = data.video_url;
            videoTitle.textContent = data.title || 'TikTok Video';
            videoAuthor.textContent = data.author || 'Unknown';
            
            // Sử dụng proxy endpoint để force download
            const proxyUrl = `/api/proxy?url=${encodeURIComponent(data.video_url)}`;
            downloadLink.href = proxyUrl;
            downloadLink.download = 'tiktok_video.mp4';
            downloadLink.target = '_self';
            
            // Thêm event listener để đảm bảo download
            downloadLink.onclick = function(e) {
                // Tải video bằng fetch và blob để đảm bảo download
                e.preventDefault();
                downloadVideoAsBlob(data.video_url, data.title || 'tiktok_video');
            };
            
            // Hiển thị kết quả
            resultSection.style.display = 'block';
            
            // Tự động tải video
            downloadVideoAsBlob(data.video_url, data.title || 'tiktok_video');
        } else {
            showError(data.error || 'Không thể tải video. Vui lòng thử lại.');
            showProgress(false);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Đã xảy ra lỗi. Vui lòng thử lại sau.');
        showProgress(false);
    } finally {
        // Không set loading false ở đây vì downloadVideoAsBlob sẽ xử lý
    }
}

function setLoading(loading) {
    downloadBtn.disabled = loading;
    const btnText = downloadBtn.querySelector('.btn-text');
    const btnLoader = downloadBtn.querySelector('.btn-loader');
    
    if (loading) {
        btnText.style.display = 'none';
        btnLoader.style.display = 'flex';
    } else {
        btnText.style.display = 'inline';
        btnLoader.style.display = 'none';
    }
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    resultSection.style.display = 'none';
    showProgress(false);
}

// Hàm tải video bằng blob để đảm bảo download
async function downloadVideoAsBlob(videoUrl, filename) {
    try {
        setLoading(true);
        showProgress(true);
        updateProgress(0, 'Đang kết nối...', 0, 0);
        
        downloadStartTime = Date.now();
        lastLoaded = 0;
        lastTime = downloadStartTime;
        
        // Tải video qua proxy với progress tracking
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}`;
        const response = await fetch(proxyUrl);
        
        if (!response.ok) {
            throw new Error('Failed to download video');
        }
        
        const contentLength = response.headers.get('content-length');
        const total = contentLength ? parseInt(contentLength, 10) : 0;
        
        if (!response.body) {
            throw new Error('Response body is null');
        }
        
        const reader = response.body.getReader();
        const chunks = [];
        let loaded = 0;
        let estimatedPercent = 0;
        
        updateProgress(0, 'Đang tải video...', 0, 0);
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                break;
            }
            
            chunks.push(value);
            loaded += value.length;
            
            // Tính toán phần trăm
            let percent = 0;
            if (total > 0) {
                percent = Math.min(Math.round((loaded / total) * 100), 100);
            } else {
                // Nếu không có total, ước tính dựa trên tốc độ tải
                estimatedPercent = Math.min(estimatedPercent + 2, 95);
                percent = estimatedPercent;
            }
            
            // Tính tốc độ tải
            const now = Date.now();
            const timeDiff = (now - lastTime) / 1000; // seconds
            const loadedDiff = loaded - lastLoaded;
            
            let speed = 0;
            if (timeDiff > 0.1) { // Chỉ tính khi có đủ thời gian
                speed = loadedDiff / timeDiff; // bytes per second
            }
            
            // Cập nhật UI
            const statusText = total > 0 ? 'Đang tải video...' : 'Đang tải video...';
            updateProgress(percent, statusText, loaded, speed);
            
            lastLoaded = loaded;
            lastTime = now;
        }
        
        // Đảm bảo hiển thị 100% khi hoàn thành
        if (total > 0) {
            updateProgress(100, 'Hoàn thành!', loaded, 0);
        } else {
            updateProgress(100, 'Hoàn thành!', loaded, 0);
        }
        
        // Tạo blob từ chunks
        const blob = new Blob(chunks, { type: 'video/mp4' });
        
        updateProgress(100, 'Đang lưu file...', loaded, 0);
        
        // Tạo URL từ blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Tạo link tải xuống
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename.replace(/[^a-z0-9]/gi, '_') + '.mp4';
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
            showProgress(false);
            setLoading(false);
            updateProgress(0, '', 0, 0);
        }, 100);
        
    } catch (error) {
        console.error('Download error:', error);
        showProgress(false);
        showError('Lỗi khi tải video: ' + error.message);
        setLoading(false);
    }
}

function showProgress(show) {
    if (progressContainer) {
        progressContainer.style.display = show ? 'block' : 'none';
    }
}

function updateProgress(percent, text, loaded, speed) {
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    
    if (progressText) {
        progressText.textContent = text || 'Đang tải video...';
    }
    
    if (progressPercent) {
        progressPercent.textContent = percent + '%';
    }
    
    if (progressSize) {
        const sizeMB = (loaded / (1024 * 1024)).toFixed(2);
        progressSize.textContent = sizeMB + ' MB';
    }
    
    if (progressSpeed) {
        if (speed > 0) {
            const speedMB = (speed / (1024 * 1024)).toFixed(2);
            progressSpeed.textContent = speedMB + ' MB/s';
        } else {
            progressSpeed.textContent = '0 MB/s';
        }
    }
}

// Xóa placeholder khi focus
tiktokUrlInput.addEventListener('focus', function() {
    this.placeholder = '';
});

tiktokUrlInput.addEventListener('blur', function() {
    if (!this.value) {
        this.placeholder = 'Dán link TikTok vào đây...';
    }
});

