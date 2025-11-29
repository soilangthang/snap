const videoUrlInput = document.getElementById('videoUrl');
const downloadBtn = document.getElementById('downloadBtn');
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const videoThumbnail = document.getElementById('videoThumbnail');
const authorAvatar = document.getElementById('authorAvatar');
const downloadSD = document.getElementById('downloadSD');
const downloadHD = document.getElementById('downloadHD');
const downloadOther = document.getElementById('downloadOther');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const progressPercent = document.getElementById('progressPercent');
const progressSize = document.getElementById('progressSize');
const progressSpeed = document.getElementById('progressSpeed');

let currentVideoData = {
    video_url: '',
    video_url_hd: '',
    title: '',
    author: '',
    video_id: '',
    filename: ''
};
let currentVideoUrl = ''; // For copy link functionality
let downloadStartTime = 0;
let lastLoaded = 0;
let lastTime = 0;

// Hàm tạo tên file nhất quán
function generateFilename(videoId, title) {
    // Sanitize title: loại bỏ ký tự đặc biệt, giữ lại chữ, số, khoảng trắng
    let sanitizedTitle = '';
    if (title && title !== 'TikTok Video') {
        // Chuyển đổi tiếng Việt có dấu thành không dấu và sanitize
        sanitizedTitle = title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
            .replace(/[^a-z0-9\s-]/gi, '') // Remove special chars except spaces and hyphens
            .replace(/\s+/g, '_') // Replace spaces with underscores
            .substring(0, 50) // Limit length
            .toLowerCase();
    }
    
    // Sử dụng video ID làm phần chính, thêm title nếu có
    if (videoId) {
        if (sanitizedTitle) {
            return `tiktok_${videoId}_${sanitizedTitle}.mp4`;
        }
        return `tiktok_${videoId}.mp4`;
    }
    
    // Fallback nếu không có video ID
    if (sanitizedTitle) {
        return `tiktok_${sanitizedTitle}.mp4`;
    }
    
    return 'tiktok_video.mp4';
}

// Xử lý khi nhấn nút tải
downloadBtn.addEventListener('click', handleDownload);

// Xử lý khi nhấn Enter
videoUrlInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleDownload();
    }
});

// Setup download buttons
function setupDownloadButtons() {
    // Download SD
    downloadSD.onclick = () => {
        if (currentVideoData.video_url) {
            downloadVideoAsBlob(currentVideoData.video_url, currentVideoData.filename);
        }
    };
    
    // Download HD
    downloadHD.onclick = () => {
        const hdUrl = currentVideoData.video_url_hd || currentVideoData.video_url;
        const hdFilename = currentVideoData.filename.replace('.mp4', '_HD.mp4');
        if (hdUrl) {
            downloadVideoAsBlob(hdUrl, hdFilename);
        }
    };
    
    // Download other video (reset form)
    downloadOther.onclick = () => {
        videoUrlInput.value = '';
        resultSection.style.display = 'none';
        errorMessage.style.display = 'none';
        videoUrlInput.focus();
    };
}

async function handleDownload() {
    const url = videoUrlInput.value.trim();
    
    // Validate URL
    if (!url) {
        showError('Please enter a TikTok URL');
        return;
    }
    
    // Validate TikTok URL
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
        showError('Invalid URL. Please enter a valid TikTok link');
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
            // Lưu thông tin video
            currentVideoData = {
                video_url: data.video_url || '',
                video_url_hd: data.video_url_hd || data.video_url || '',
                title: data.title || 'TikTok Video',
                author: data.author || 'Unknown',
                video_id: data.video_id || '',
                filename: generateFilename(data.video_id, data.title)
            };
            
            // Hiển thị thông tin video
            videoTitle.textContent = currentVideoData.title;
            videoAuthor.textContent = currentVideoData.author;
            
            // Hiển thị thumbnail
            if (data.thumbnail) {
                videoThumbnail.src = data.thumbnail;
                videoThumbnail.style.display = 'block';
                videoThumbnail.onerror = function() {
                    this.style.display = 'none';
                };
            } else {
                videoThumbnail.style.display = 'none';
            }
            
            // Hiển thị author avatar
            if (data.author_avatar) {
                authorAvatar.src = data.author_avatar;
                authorAvatar.style.display = 'block';
                authorAvatar.onerror = function() {
                    this.style.display = 'none';
                };
            } else {
                authorAvatar.style.display = 'none';
            }
            
            // Update currentVideoUrl for copy functionality
            currentVideoUrl = currentVideoData.video_url;
            
            // Setup download buttons
            setupDownloadButtons();
            
            // Show results
            resultSection.style.display = 'block';
        } else {
            showError(data.error || 'Unable to download video. Please try again.');
            showProgress(false);
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred. Please try again later.');
        showProgress(false);
    } finally {
        // Don't set loading false here as downloadVideoAsBlob will handle it
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
        updateProgress(0, 'Connecting...', 0, 0);
        
        downloadStartTime = Date.now();
        lastLoaded = 0;
        lastTime = downloadStartTime;
        
        // Tải video qua proxy
        const proxyUrl = `/api/proxy?url=${encodeURIComponent(videoUrl)}`;
        let response;
        
        try {
            response = await fetch(proxyUrl, {
                method: 'GET',
                cache: 'no-cache',
            });
            
            if (!response.ok) {
                throw new Error(`Server error: ${response.status}`);
            }
        } catch (error) {
            console.error('Proxy error:', error);
            // Fallback: download directly from original URL
            showProgress(false);
            updateProgress(0, 'Opening direct download link...', 0, 0);
            
            // Tạo link download trực tiếp
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = filename.endsWith('.mp4') ? filename : filename + '.mp4';
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => {
                showProgress(false);
                setLoading(false);
            }, 1000);
            return;
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
        
        updateProgress(0, 'Downloading video...', 0, 0);
        
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
            
            // Update UI
            const statusText = 'Downloading video...';
            updateProgress(percent, statusText, loaded, speed);
            
            lastLoaded = loaded;
            lastTime = now;
        }
        
        // Ensure 100% is displayed when complete
        updateProgress(100, 'Completed!', loaded, 0);
        
        // Create blob from chunks
        const blob = new Blob(chunks, { type: 'video/mp4' });
        
        updateProgress(100, 'Saving file...', loaded, 0);
        
        // Tạo URL từ blob
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Tạo link tải xuống
        const a = document.createElement('a');
        a.href = blobUrl;
        // Filename đã được sanitize trong generateFilename
        a.download = filename.endsWith('.mp4') ? filename : filename + '.mp4';
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
        
        // Better error messages
        let errorMsg = 'Error downloading video';
        if (error.message.includes('network') || error.message.includes('Network')) {
            errorMsg = 'Network connection error. Please check your connection and try again.';
        } else if (error.message.includes('server')) {
            errorMsg = 'Server error. Please try again later.';
        } else if (error.message) {
            errorMsg = 'Error: ' + error.message;
        }
        
        showError(errorMsg);
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
        progressText.textContent = text || 'Downloading video...';
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
videoUrlInput.addEventListener('focus', function() {
    this.placeholder = '';
});

videoUrlInput.addEventListener('blur', function() {
    if (!this.value) {
        this.placeholder = 'Paste TikTok video URL here...';
    }
});

// Visitor Counter
async function updateVisitorCount() {
    try {
        const visitorCountEl = document.getElementById('visitorCount');
        if (!visitorCountEl) return;
        
        // Check if user already visited in this session
        const sessionKey = 'visitor_counted_' + new Date().toDateString();
        const hasCounted = sessionStorage.getItem(sessionKey);
        
        if (!hasCounted) {
            // Increment counter
            const response = await fetch('/api/visitor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
            
            if (response.ok) {
                sessionStorage.setItem(sessionKey, 'true');
            }
        }
        
        // Get current count
        const countResponse = await fetch('/api/visitor', {
            method: 'GET'
        });
        
        if (countResponse.ok) {
            const data = await countResponse.json();
            if (data.success && data.count !== undefined) {
                // Format number with thousand separators
                const formattedCount = data.count.toLocaleString('en-US');
                visitorCountEl.textContent = formattedCount;
            }
        }
    } catch (error) {
        console.error('Error updating visitor count:', error);
    }
}

// Update visitor count on page load
document.addEventListener('DOMContentLoaded', function() {
    updateVisitorCount();
});

