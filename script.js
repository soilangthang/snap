// DOM Elements
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
    filename: '',
    thumbnail: ''  // Thêm thumbnail URL
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
if (downloadBtn) {
    downloadBtn.addEventListener('click', handleDownload);
}

// Xử lý khi nhấn Enter
if (videoUrlInput) {
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleDownload();
        }
    });
}

// Setup download buttons
function setupDownloadButtons() {
    if (!downloadSD || !downloadHD) return;
    
    // Download SD - Standard Definition (lower quality, smaller file)
    downloadSD.onclick = () => {
        if (currentVideoData.video_url) {
            downloadVideoAsBlob(currentVideoData.video_url, currentVideoData.filename);
        }
    };
    
    // Download HD - High Definition (better quality, larger file)
    downloadHD.onclick = () => {
        const hdUrl = currentVideoData.video_url_hd || currentVideoData.video_url;
        const hdFilename = currentVideoData.filename.replace('.mp4', '_HD.mp4');
        if (hdUrl) {
            downloadVideoAsBlob(hdUrl, hdFilename);
        }
    };
    
    // Download MP3 - Extract audio from video
    const downloadMP3Btn = document.getElementById('downloadMP3');
    if (downloadMP3Btn) {
        downloadMP3Btn.onclick = () => {
            const videoUrl = currentVideoData.video_url_hd || currentVideoData.video_url;
            if (videoUrl) {
                downloadAudioFromVideo(videoUrl);
            }
        };
    }
    
    // Download Image - Download thumbnail/cover image
    const downloadImageBtn = document.getElementById('downloadImage');
    if (downloadImageBtn) {
        downloadImageBtn.onclick = () => {
            if (currentVideoData.thumbnail) {
                downloadImage(currentVideoData.thumbnail);
            } else {
                const errorMsgs = {
                    en: 'Thumbnail not available',
                    hi: 'थंबनेल उपलब्ध नहीं है',
                    vi: 'Không có ảnh thumbnail',
                    id: 'Thumbnail tidak tersedia'
                };
                showError(errorMsgs[currentLang] || errorMsgs.en);
            }
        };
    }
}

async function handleDownload() {
    const url = videoUrlInput.value.trim();
    
    // Validate URL
    if (!url) {
        const errorMsgs = {
            en: 'Please enter a TikTok URL',
            hi: 'कृपया एक TikTok URL दर्ज करें',
            vi: 'Vui lòng nhập URL TikTok',
            id: 'Silakan masukkan URL TikTok'
        };
        showError(errorMsgs[currentLang] || errorMsgs.en);
        return;
    }
    
    // Validate TikTok URL
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
        const errorMsgs = {
            en: 'Invalid URL. Please enter a valid TikTok link',
            hi: 'अमान्य URL. कृपया एक वैध TikTok लिंक दर्ज करें',
            vi: 'URL không hợp lệ. Vui lòng nhập link TikTok hợp lệ',
            id: 'URL tidak valid. Silakan masukkan tautan TikTok yang valid'
        };
        showError(errorMsgs[currentLang] || errorMsgs.en);
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
                filename: generateFilename(data.video_id, data.title),
                thumbnail: data.thumbnail || '',  // Lưu thumbnail URL
                audio_url: data.audio_url || ''  // Lưu audio URL cho MP3 download
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
    if (!downloadBtn) return;
    
    downloadBtn.disabled = loading;
    downloadBtn.classList.toggle('loading', loading);
    
    if (loading) {
        downloadBtn.setAttribute('disabled', 'true');
    } else {
        downloadBtn.removeAttribute('disabled');
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
if (videoUrlInput) {
    videoUrlInput.addEventListener('focus', function() {
        this.placeholder = '';
    });

    videoUrlInput.addEventListener('blur', function() {
        if (!this.value) {
            this.placeholder = 'Paste TikTok video URL here...';
        }
    });
}

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

// ============================================
// DOWNLOAD IMAGE (Thumbnail)
// ============================================

async function downloadImage(imageUrl) {
    try {
        setLoading(true);
        showProgress(true);
        updateProgress(0, 'Downloading image...', 0, 0);
        
        // Sử dụng proxy để tránh CORS
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`;
        
        let response;
        try {
            response = await fetch(proxyUrl);
            if (!response.ok) throw new Error('Failed to fetch image');
        } catch (error) {
            // Fallback: thử fetch trực tiếp
            console.warn('Proxy failed, trying direct fetch:', error);
            response = await fetch(imageUrl, {
                mode: 'cors',
                credentials: 'omit',
            });
            if (!response.ok) throw new Error('Failed to fetch image');
        }
        
        updateProgress(50, 'Processing image...', 0, 0);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Get filename from video data
        const filename = currentVideoData.video_id 
            ? `tiktok_${currentVideoData.video_id}_thumbnail.jpg`
            : 'tiktok_thumbnail.jpg';
        
        updateProgress(90, 'Saving image...', 0, 0);
        
        // Create download link
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
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
        console.error('Error downloading image:', error);
        const errorMsgs = {
            en: 'Failed to download image. Please try again.',
            hi: 'छवि डाउनलोड करने में विफल। कृपया पुनः प्रयास करें।',
            vi: 'Không thể tải ảnh. Vui lòng thử lại.',
            id: 'Gagal mengunduh gambar. Silakan coba lagi.'
        };
        showError(errorMsgs[currentLang] || errorMsgs.en);
        showProgress(false);
        setLoading(false);
    }
}

// ============================================
// DOWNLOAD MP3 (Extract Audio from Video)
// ============================================

async function downloadAudioFromVideo(videoUrl) {
    try {
        setLoading(true);
        showProgress(true);
        updateProgress(0, 'Preparing audio download...', 0, 0);
        
        // Kiểm tra xem có audio URL từ video data không
        let audioUrl = currentVideoData.audio_url;
        
        if (!audioUrl) {
            // Nếu không có, thử gọi API extract audio
            updateProgress(10, 'Requesting audio extraction...', 0, 0);
            
            const response = await fetch('/api/extract-audio', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    video_url: videoUrl,
                    video_id: currentVideoData.video_id || ''
                })
            });
            
            const data = await response.json();
            if (data.success && data.audio_url) {
                audioUrl = data.audio_url;
            }
        }
        
        if (audioUrl) {
            // Có audio URL, tải về
            updateProgress(30, 'Downloading audio...', 0, 0);
            
            // Tải audio file qua proxy
            const audioResponse = await fetch(`/api/proxy-image?url=${encodeURIComponent(audioUrl)}`);
            
            if (!audioResponse.ok) {
                throw new Error('Failed to download audio');
            }
            
            const blob = await audioResponse.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            
            // Tạo tên file MP3
            const filename = currentVideoData.video_id 
                ? `tiktok_${currentVideoData.video_id}_audio.mp3`
                : 'tiktok_audio.mp3';
            
            updateProgress(90, 'Saving audio file...', 0, 0);
            
            // Tạo link download
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
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
            
        } else {
            // Không có audio URL, hiển thị thông báo
            const errorMsgs = {
                en: 'Audio URL not available for this video. You can download the video and convert it to MP3 using online converters (e.g., online-audio-converter.com, convertio.co) or apps like Audacity.',
                hi: 'इस वीडियो के लिए ऑडियो URL उपलब्ध नहीं है। आप वीडियो डाउनलोड कर सकते हैं और इसे ऑनलाइन कन्वर्टर (जैसे online-audio-converter.com, convertio.co) या Audacity जैसे ऐप्स का उपयोग करके MP3 में कन्वर्ट कर सकते हैं।',
                vi: 'URL audio không khả dụng cho video này. Bạn có thể tải video và chuyển đổi sang MP3 bằng các công cụ online (ví dụ: online-audio-converter.com, convertio.co) hoặc ứng dụng như Audacity.',
                id: 'URL audio tidak tersedia untuk video ini. Anda dapat mengunduh video dan mengonversinya ke MP3 menggunakan konverter online (mis. online-audio-converter.com, convertio.co) atau aplikasi seperti Audacity.'
            };
            
            showError(errorMsgs[currentLang] || errorMsgs.en);
            showProgress(false);
            setLoading(false);
        }
        
    } catch (error) {
        console.error('Error extracting audio:', error);
        const errorMsgs = {
            en: 'Failed to extract audio. Please try again or download the video and convert it manually.',
            hi: 'ऑडियो निकालने में विफल। कृपया पुनः प्रयास करें या वीडियो डाउनलोड करके मैन्युअल रूप से कन्वर्ट करें।',
            vi: 'Không thể trích xuất âm thanh. Vui lòng thử lại hoặc tải video và chuyển đổi thủ công.',
            id: 'Gagal mengekstrak audio. Silakan coba lagi atau unduh video dan konversi secara manual.'
        };
        showError(errorMsgs[currentLang] || errorMsgs.en);
        showProgress(false);
        setLoading(false);
    }
}

// Update visitor count on page load
// Sidebar functionality - visible on desktop, toggle on mobile
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggleMobile = document.getElementById('sidebarToggleMobile');
    const sidebarCloseMobile = document.getElementById('sidebarCloseMobile');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar) return;
    
    // Chỉ áp dụng trên mobile
    if (window.innerWidth <= 640) {
        // Show toggle button on mobile
        if (sidebarToggleMobile) {
            sidebarToggleMobile.style.display = 'flex';
        }
        if (sidebarCloseMobile) {
            sidebarCloseMobile.style.display = 'flex';
        }
        
        function openSidebar() {
            if (sidebar) sidebar.classList.add('sidebar-visible');
            if (sidebarOverlay) sidebarOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
        
        function closeSidebar() {
            if (sidebar) sidebar.classList.remove('sidebar-visible');
            if (sidebarOverlay) sidebarOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
        
        if (sidebarToggleMobile) {
            sidebarToggleMobile.addEventListener('click', openSidebar);
        }
        
        if (sidebarCloseMobile) {
            sidebarCloseMobile.addEventListener('click', closeSidebar);
        }
        
        if (sidebarOverlay) {
            sidebarOverlay.addEventListener('click', closeSidebar);
        }
        
        // Close sidebar when clicking menu items on mobile
        const sidebarItems = sidebar.querySelectorAll('.sidebar-item');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                setTimeout(closeSidebar, 100); // Delay để cho navigation xảy ra trước
            });
        });
        
        // Handle window resize
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                if (window.innerWidth > 640) {
                    // Desktop - hide toggle, show sidebar
                    if (sidebarToggleMobile) sidebarToggleMobile.style.display = 'none';
                    if (sidebarCloseMobile) sidebarCloseMobile.style.display = 'none';
                    if (sidebar) sidebar.classList.add('sidebar-visible');
                    if (sidebarOverlay) sidebarOverlay.classList.remove('active');
                } else {
                    // Mobile - show toggle, hide sidebar initially
                    if (sidebarToggleMobile) sidebarToggleMobile.style.display = 'flex';
                    if (sidebarCloseMobile) sidebarCloseMobile.style.display = 'flex';
                    if (sidebar) sidebar.classList.remove('sidebar-visible');
                }
            }, 100);
        });
    }
}

document.addEventListener('DOMContentLoaded', function() {
    updateVisitorCount();
    initLanguageSwitcher();
    initFAQ();
    initPasteButton();
    initSidebar();
});

// ============================================
// MULTILINGUAL SUPPORT (i18n)
// ============================================

const translations = {
    en: {
        title: "TikTok Video Downloader",
        subtitle: "Download high-quality TikTok videos without watermark",
        inputPlaceholder: "Paste TikTok video URL here...",
        pasteBtn: "Paste",
        downloadVideo: "Download MP4",
        downloadAudio: "Download MP3",
        downloadImage: "Download Image",
        downloadSD: "Download SD",
        downloadHD: "Download HD",
        downloadImage: "Download Image",
        downloading: "Downloading...",
        popularFeatures: "Popular Features",
        featureHD: "HD Quality",
        featureHDDesc: "Download videos in original quality",
        featureNoWatermark: "No Watermark",
        featureNoWatermarkDesc: "Clean videos without TikTok logo",
        featureFast: "Fast Download",
        featureFastDesc: "Quick and simple process",
        featureSecure: "Secure & Private",
        featureSecureDesc: "No data storage, completely safe",
        howToUse: "How to Use",
        step1Title: "Copy Link",
        step1Desc: "Copy the TikTok video URL from the app",
        step2Title: "Paste & Download",
        step2Desc: "Paste the link and click download button",
        step3Title: "Choose Quality",
        step3Desc: "Select SD or HD quality and save",
        faqTitle: "Frequently Asked Questions",
        faq1Question: "Is this service free?",
        faq1Answer: "Yes, our TikTok downloader is completely free to use. No registration or payment required.",
        faq2Question: "Will downloaded videos have watermark?",
        faq2Answer: "No, all downloaded videos are watermark-free. Enjoy clean videos without TikTok branding.",
        faq3Question: "What video formats are supported?",
        faq3Answer: "We support MP4 format for videos and MP3 for audio extraction. Both SD and HD qualities are available.",
        faq4Question: "Is my data safe?",
        faq4Answer: "Yes, we don't store any of your data. All downloads are processed securely and privately.",
        allRightsReserved: "All rights reserved.",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        home: "Home",
        blog: "Blog",
        // GameFun translations
        gamefunTitle: "GameFun",
        gamefunSubtitle: "Choose a game to play",
        caroGame: "Tic Tac Toe",
        caroGameDesc: "Play tic tac toe with intelligent AI. Challenge your intelligence!",
        difficulty: "AI Difficulty:",
        easy: "Easy",
        medium: "Medium",
        hard: "Hard",
        currentTurn: "Current Turn",
        gameResult: "Game Result",
        playing: "Playing",
        yourTurn: "You (X)",
        aiTurn: "AI (O)",
        gameOver: "Game Over",
        youWin: "🎉 You win! Congratulations!",
        aiWins: "🤖 AI wins! Try again!",
        draw: "🤝 Draw! Play again!",
        newGame: "New Game",
        reset: "Reset",
        backToList: "← Back to list",
        youWinResult: "You win",
        aiWinsResult: "AI wins",
        drawResult: "Draw"
    },
    hi: {
        title: "TikTok वीडियो डाउनलोडर",
        subtitle: "वॉटरमार्क के बिना उच्च गुणवत्ता वाले TikTok वीडियो डाउनलोड करें",
        inputPlaceholder: "TikTok वीडियो URL यहाँ पेस्ट करें...",
        pasteBtn: "पेस्ट करें",
        downloadVideo: "MP4 डाउनलोड",
        downloadAudio: "MP3 डाउनलोड",
        downloadSD: "SD डाउनलोड",
        downloadHD: "HD डाउनलोड",
        downloadImage: "छवि डाउनलोड",
        downloading: "डाउनलोड हो रहा है...",
        popularFeatures: "लोकप्रिय सुविधाएं",
        featureHD: "HD गुणवत्ता",
        featureHDDesc: "मूल गुणवत्ता में वीडियो डाउनलोड करें",
        featureNoWatermark: "कोई वॉटरमार्क नहीं",
        featureNoWatermarkDesc: "TikTok लोगो के बिना साफ वीडियो",
        featureFast: "तेज़ डाउनलोड",
        featureFastDesc: "त्वरित और सरल प्रक्रिया",
        featureSecure: "सुरक्षित और निजी",
        featureSecureDesc: "कोई डेटा संग्रहण नहीं, पूरी तरह से सुरक्षित",
        howToUse: "उपयोग कैसे करें",
        step1Title: "लिंक कॉपी करें",
        step1Desc: "ऐप से TikTok वीडियो URL कॉपी करें",
        step2Title: "पेस्ट करें और डाउनलोड करें",
        step2Desc: "लिंक पेस्ट करें और डाउनलोड बटन पर क्लिक करें",
        step3Title: "गुणवत्ता चुनें",
        step3Desc: "SD या HD गुणवत्ता चुनें और सेव करें",
        faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
        faq1Question: "क्या यह सेवा मुफ्त है?",
        faq1Answer: "हाँ, हमारा TikTok डाउनलोडर पूरी तरह से मुफ्त है। कोई पंजीकरण या भुगतान आवश्यक नहीं है।",
        faq2Question: "क्या डाउनलोड किए गए वीडियो में वॉटरमार्क होगा?",
        faq2Answer: "नहीं, सभी डाउनलोड किए गए वीडियो वॉटरमार्क-मुक्त हैं। TikTok ब्रांडिंग के बिना साफ वीडियो का आनंद लें।",
        faq3Question: "कौन से वीडियो प्रारूप समर्थित हैं?",
        faq3Answer: "हम वीडियो के लिए MP4 प्रारूप और ऑडियो निष्कर्षण के लिए MP3 का समर्थन करते हैं। SD और HD दोनों गुणवत्ता उपलब्ध हैं।",
        faq4Question: "क्या मेरा डेटा सुरक्षित है?",
        faq4Answer: "हाँ, हम आपका कोई डेटा संग्रहीत नहीं करते हैं। सभी डाउनलोड सुरक्षित और निजी तौर पर संसाधित किए जाते हैं।",
        allRightsReserved: "सभी अधिकार सुरक्षित।",
        privacy: "गोपनीयता नीति",
        terms: "सेवा की शर्तें",
        home: "होम",
        blog: "ब्लॉग",
        // GameFun translations
        gamefunTitle: "GameFun",
        gamefunSubtitle: "खेलने के लिए एक गेम चुनें",
        caroGame: "टिक टैक टो",
        caroGameDesc: "बुद्धिमान AI के साथ टिक टैक टो खेलें। अपनी बुद्धिमत्ता को चुनौती दें!",
        difficulty: "AI कठिनाई:",
        easy: "आसान",
        medium: "मध्यम",
        hard: "कठिन",
        currentTurn: "वर्तमान मोड़",
        gameResult: "गेम परिणाम",
        playing: "खेल रहे हैं",
        yourTurn: "आप (X)",
        aiTurn: "AI (O)",
        gameOver: "गेम समाप्त",
        youWin: "🎉 आप जीत गए! बधाई हो!",
        aiWins: "🤖 AI जीत गया! फिर से कोशिश करें!",
        draw: "🤝 ड्रॉ! फिर से खेलें!",
        newGame: "नया गेम",
        reset: "रीसेट",
        backToList: "← सूची में वापस",
        youWinResult: "आप जीते",
        aiWinsResult: "AI जीता",
        drawResult: "ड्रॉ"
    },
    vi: {
        title: "Trình Tải Video TikTok",
        subtitle: "Tải video TikTok chất lượng cao không watermark",
        inputPlaceholder: "Dán link video TikTok vào đây...",
        pasteBtn: "Dán",
        downloadVideo: "Tải MP4",
        downloadAudio: "Tải MP3",
        downloadSD: "Tải SD",
        downloadHD: "Tải HD",
        downloadImage: "Tải Ảnh",
        downloading: "Đang tải...",
        popularFeatures: "Tính Năng Phổ Biến",
        featureHD: "Chất Lượng HD",
        featureHDDesc: "Tải video chất lượng gốc",
        featureNoWatermark: "Không Watermark",
        featureNoWatermarkDesc: "Video sạch không logo TikTok",
        featureFast: "Tải Nhanh",
        featureFastDesc: "Quá trình nhanh và đơn giản",
        featureSecure: "An Toàn & Riêng Tư",
        featureSecureDesc: "Không lưu trữ dữ liệu, hoàn toàn an toàn",
        howToUse: "Cách Sử Dụng",
        step1Title: "Sao Chép Link",
        step1Desc: "Sao chép URL video TikTok từ ứng dụng",
        step2Title: "Dán & Tải",
        step2Desc: "Dán link và nhấn nút tải",
        step3Title: "Chọn Chất Lượng",
        step3Desc: "Chọn chất lượng SD hoặc HD và lưu",
        faqTitle: "Câu Hỏi Thường Gặp",
        faq1Question: "Dịch vụ này có miễn phí không?",
        faq1Answer: "Có, trình tải TikTok của chúng tôi hoàn toàn miễn phí. Không cần đăng ký hay thanh toán.",
        faq2Question: "Video tải về có watermark không?",
        faq2Answer: "Không, tất cả video tải về đều không có watermark. Thưởng thức video sạch không logo TikTok.",
        faq3Question: "Hỗ trợ định dạng video nào?",
        faq3Answer: "Chúng tôi hỗ trợ định dạng MP4 cho video và MP3 cho trích xuất âm thanh. Có cả chất lượng SD và HD.",
        faq4Question: "Dữ liệu của tôi có an toàn không?",
        faq4Answer: "Có, chúng tôi không lưu trữ dữ liệu của bạn. Tất cả tải xuống được xử lý an toàn và riêng tư.",
        allRightsReserved: "Bảo lưu mọi quyền.",
        privacy: "Chính Sách Bảo Mật",
        terms: "Điều Khoản Sử Dụng",
        home: "Trang chủ",
        blog: "Blog",
        // GameFun translations
        gamefunTitle: "GameFun",
        gamefunSubtitle: "Chọn game để chơi",
        caroGame: "Cờ Caro",
        caroGameDesc: "Chơi cờ caro với AI thông minh. Thử thách trí tuệ của bạn!",
        difficulty: "Độ khó AI:",
        easy: "Dễ",
        medium: "Trung bình",
        hard: "Khó",
        currentTurn: "Lượt chơi",
        gameResult: "Kết quả",
        playing: "Đang chơi",
        yourTurn: "Bạn (X)",
        aiTurn: "AI (O)",
        gameOver: "Kết thúc",
        youWin: "🎉 Bạn thắng! Chúc mừng!",
        aiWins: "🤖 AI thắng! Thử lại nhé!",
        draw: "🤝 Hòa! Chơi lại nhé!",
        newGame: "Game mới",
        reset: "Reset",
        backToList: "← Về danh sách",
        youWinResult: "Bạn thắng",
        aiWinsResult: "AI thắng",
        drawResult: "Hòa"
    },
    id: {
        title: "Pengunduh Video TikTok",
        subtitle: "Unduh video TikTok berkualitas tinggi tanpa watermark",
        inputPlaceholder: "Tempel URL video TikTok di sini...",
        pasteBtn: "Tempel",
        downloadVideo: "Unduh MP4",
        downloadAudio: "Unduh MP3",
        downloadSD: "Unduh SD",
        downloadHD: "Unduh HD",
        downloadImage: "Unduh Gambar",
        downloading: "Mengunduh...",
        popularFeatures: "Fitur Populer",
        featureHD: "Kualitas HD",
        featureHDDesc: "Unduh video dalam kualitas asli",
        featureNoWatermark: "Tanpa Watermark",
        featureNoWatermarkDesc: "Video bersih tanpa logo TikTok",
        featureFast: "Unduh Cepat",
        featureFastDesc: "Proses cepat dan sederhana",
        featureSecure: "Aman & Privat",
        featureSecureDesc: "Tidak menyimpan data, sepenuhnya aman",
        howToUse: "Cara Menggunakan",
        step1Title: "Salin Tautan",
        step1Desc: "Salin URL video TikTok dari aplikasi",
        step2Title: "Tempel & Unduh",
        step2Desc: "Tempel tautan dan klik tombol unduh",
        step3Title: "Pilih Kualitas",
        step3Desc: "Pilih kualitas SD atau HD dan simpan",
        faqTitle: "Pertanyaan yang Sering Diajukan",
        faq1Question: "Apakah layanan ini gratis?",
        faq1Answer: "Ya, pengunduh TikTok kami sepenuhnya gratis. Tidak perlu registrasi atau pembayaran.",
        faq2Question: "Apakah video yang diunduh memiliki watermark?",
        faq2Answer: "Tidak, semua video yang diunduh bebas watermark. Nikmati video bersih tanpa branding TikTok.",
        faq3Question: "Format video apa yang didukung?",
        faq3Answer: "Kami mendukung format MP4 untuk video dan MP3 untuk ekstraksi audio. Kedua kualitas SD dan HD tersedia.",
        faq4Question: "Apakah data saya aman?",
        faq4Answer: "Ya, kami tidak menyimpan data Anda. Semua unduhan diproses dengan aman dan privat.",
        allRightsReserved: "Hak cipta dilindungi.",
        privacy: "Kebijakan Privasi",
        terms: "Ketentuan Layanan",
        home: "Beranda",
        blog: "Blog",
        // GameFun translations
        gamefunTitle: "GameFun",
        gamefunSubtitle: "Pilih game untuk dimainkan",
        caroGame: "Tic Tac Toe",
        caroGameDesc: "Bermain tic tac toe dengan AI yang cerdas. Tantang kecerdasan Anda!",
        difficulty: "Tingkat Kesulitan AI:",
        easy: "Mudah",
        medium: "Sedang",
        hard: "Sulit",
        currentTurn: "Giliran Saat Ini",
        gameResult: "Hasil Permainan",
        playing: "Bermain",
        yourTurn: "Anda (X)",
        aiTurn: "AI (O)",
        gameOver: "Permainan Selesai",
        youWin: "🎉 Anda menang! Selamat!",
        aiWins: "🤖 AI menang! Coba lagi!",
        draw: "🤝 Seri! Main lagi!",
        newGame: "Game Baru",
        reset: "Reset",
        backToList: "← Kembali ke daftar",
        youWinResult: "Anda menang",
        aiWinsResult: "AI menang",
        drawResult: "Seri"
    }
};

let currentLang = localStorage.getItem('language') || 'en';
// Expose to window for use in other scripts
window.currentLang = currentLang;
window.translations = translations;

function changeLanguage(lang) {
    currentLang = lang;
    window.currentLang = lang; // Update window object
    localStorage.setItem('language', lang);
    
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            el.textContent = translations[lang][key];
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });
    
    // Update HTML lang attribute
    document.documentElement.lang = lang;
    
    // Update language button text
    const langCodes = { en: 'EN', hi: 'HI', vi: 'VI', id: 'ID' };
    const langBtn = document.getElementById('currentLang');
    if (langBtn) {
        langBtn.textContent = langCodes[lang] || 'EN';
    }
}

function initLanguageSwitcher() {
    const langBtn = document.getElementById('langBtn');
    const langSwitcher = document.querySelector('.lang-switcher');
    const langOptions = document.querySelectorAll('.lang-option');
    
    if (!langBtn || !langSwitcher) return;
    
    // Set initial language
    changeLanguage(currentLang);
    
    // Toggle dropdown
    langBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        langSwitcher.classList.toggle('active');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!langSwitcher.contains(e.target)) {
            langSwitcher.classList.remove('active');
        }
    });
    
    // Handle language selection
    langOptions.forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.getAttribute('data-lang');
            changeLanguage(lang);
            langSwitcher.classList.remove('active');
        });
    });
}

// FAQ Toggle Functionality
function initFAQ() {
    const faqQuestions = document.querySelectorAll('.faq-question');
    
    faqQuestions.forEach(question => {
        question.addEventListener('click', () => {
            const faqItem = question.closest('.faq-item');
            const isActive = faqItem.classList.contains('active');
            
            // Close all FAQ items
            document.querySelectorAll('.faq-item').forEach(item => {
                item.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                faqItem.classList.add('active');
            }
        });
    });
}

// Paste Button Functionality
function initPasteButton() {
    const pasteBtn = document.getElementById('pasteBtn');
    const urlInput = document.getElementById('videoUrl');
    
    if (!pasteBtn || !urlInput) return;
    
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                urlInput.value = text;
                urlInput.focus();
                
                // Visual feedback
                pasteBtn.textContent = '✓ Pasted!';
                setTimeout(() => {
                    const translations = {
                        en: 'Paste',
                        hi: 'पेस्ट करें',
                        vi: 'Dán',
                        id: 'Tempel'
                    };
                    pasteBtn.textContent = translations[currentLang] || 'Paste';
                }, 2000);
            }
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            // Fallback: focus input
            urlInput.focus();
        }
    });
}

