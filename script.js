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
// Sidebar functionality - Always hidden by default, shown when toggled
function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebarToggle');
    const sidebarClose = document.getElementById('sidebarClose');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    
    if (!sidebar || !sidebarToggle) return;
    
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
    
    // Toggle sidebar
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            if (sidebar.classList.contains('sidebar-visible')) {
                closeSidebar();
            } else {
                openSidebar();
            }
        });
    }
    
    // Close sidebar
    if (sidebarClose) {
        sidebarClose.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking overlay
    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking menu items
    const sidebarItems = sidebar.querySelectorAll('.sidebar-item');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            setTimeout(closeSidebar, 100); // Delay để cho navigation xảy ra trước
        });
    });
    
    // Close sidebar when pressing Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('sidebar-visible')) {
            closeSidebar();
        }
    });
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
        title: "TikTok Video Downloader – Download TikTok Videos Without Watermark (Free, Fast, HD)",
        subtitle: "Download any TikTok video in high quality without watermark. Fast, free, and supports MP4, MP3, and slideshow.",
        inputPlaceholder: "Paste TikTok video URL here…",
        pasteBtn: "Paste",
        downloadVideo: "Download MP4",
        downloadAudio: "Download MP3",
        downloadImage: "Download Image",
        downloadSD: "Download SD",
        downloadHD: "Download HD",
        downloadImage: "Download Image",
        downloading: "Downloading...",
        popularFeatures: "Popular Features",
        featureNoWatermark: "No Watermark",
        featureNoWatermarkDesc: "Download TikTok videos without logo, supports normal videos, long videos, and slideshows.",
        featureMP4MP3: "MP4 & MP3 Support",
        featureMP4MP3Desc: "Download high-quality MP4 or extract MP3 audio instantly.",
        featureHD: "HD & Full HD Quality",
        featureHDDesc: "Keep original 720p/1080p/2K quality when available.",
        featureSlideshow: "Slideshow Downloader",
        featureSlideshowDesc: "Download TikTok slideshows as video or individual photos.",
        featureFast: "Fast & Unlimited",
        featureFastDesc: "No limits. Very fast download speed.",
        featureSecure: "Safe & Private",
        featureSecureDesc: "No data stored, completely secure.",
        howToUse: "How to Use",
        step1Title: "Copy the TikTok video link",
        step1Desc: "Copy the TikTok video link.",
        step2Title: "Paste it into the box above",
        step2Desc: "Paste it into the box above.",
        step3Title: "Choose format and download instantly",
        step3Desc: "Choose format (No Watermark, MP4, MP3) and download instantly.",
        whyChooseTik1s: "Why Choose Tik1s?",
        whyFaster: "Faster than other tools",
        whyFasterDesc: "Lightning-fast download speed",
        whyNoWatermark: "No watermark",
        whyNoWatermarkDesc: "Clean videos without TikTok branding",
        whyMP4MP3: "Supports MP4 & MP3",
        whyMP4MP3Desc: "Download video or extract audio",
        whySlideshow: "Slideshow support",
        whySlideshowDesc: "Download slideshows as video or photos",
        whyAllDevices: "Works on all devices",
        whyAllDevicesDesc: "Mobile, tablet, desktop compatible",
        whyFreeSafe: "Free & safe",
        whyFreeSafeDesc: "100% free, no registration, completely secure",
        faqTitle: "Frequently Asked Questions",
        faq1Question: "Is Tik1s free?",
        faq1Answer: "Yes. Tik1s is completely free to use. There are no hidden fees, no premium tiers, and no registration required. You can download as many TikTok videos as you need for personal use without paying anything.",
        faq2Question: "Can I download without watermark?",
        faq2Answer: "Yes. All videos downloaded through Tik1s are delivered without the TikTok watermark. Simply paste the link and choose Download SD or HD—the output file will be clean and ready to save or share for personal use.",
        faq3Question: "Do you store downloaded videos?",
        faq3Answer: "No. We do not store your downloaded videos or the URLs you paste. The process is anonymous and we do not keep logs that link your activity to you. Your privacy is important to us.",
        faq4Question: "Can I download slideshows?",
        faq4Answer: "Yes. Tik1s supports TikTok slideshows (photo carousels). You can download them as a single video file or as individual images, depending on what you need. The same paste-and-download flow applies.",
        faq5Question: "Can I download MP3 audio?",
        faq5Answer: "Yes. Use the \"Download MP3\" option after pasting a TikTok link to extract just the audio from the video. This is useful for saving music or voiceovers from TikTok clips without keeping the video file.",
        faq6Question: "Can I use it on any device?",
        faq6Answer: "Yes. Tik1s works in your browser on desktop (Windows, Mac, Linux), tablets, and phones. There is no app to install—just open the website, paste the link, and download. We recommend using a modern browser for the best experience.",
        faq7Question: "Does video quality reduce?",
        faq7Answer: "No. We deliver video in the best quality available from the source. When HD is available, you can choose the HD option to get 720p or 1080p. We do not compress or downgrade the video beyond what TikTok provides.",
        faq8Question: "Do I need to install an app?",
        faq8Answer: "No. Tik1s is a web-based tool. You only need a browser and an internet connection. This keeps your device clean and lets you use the same tool from any device without installing anything.",
        faq9Question: "Can I download private videos?",
        faq9Answer: "No. Only public TikTok videos can be downloaded. Private or friends-only videos are not accessible to our service, in line with TikTok's visibility settings and respect for creators' privacy.",
        faq10Question: "Do you support CapCut templates?",
        faq10Answer: "Not yet. We currently focus on standard TikTok videos, long videos, and slideshows. Support for CapCut template links may be added in a future update. Check our blog or About page for news.",
        allRightsReserved: "All rights reserved.",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
        home: "Home",
        blog: "Blog",
        about: "About"
    },
    hi: {
        title: "TikTok वीडियो डाउनलोडर – वॉटरमार्क के बिना TikTok वीडियो डाउनलोड करें (मुफ्त, तेज़, HD)",
        subtitle: "वॉटरमार्क के बिना उच्च गुणवत्ता में कोई भी TikTok वीडियो डाउनलोड करें। तेज़, मुफ्त, और MP4, MP3, और स्लाइडशो का समर्थन करता है।",
        inputPlaceholder: "TikTok वीडियो URL यहाँ पेस्ट करें…",
        pasteBtn: "पेस्ट करें",
        downloadVideo: "MP4 डाउनलोड",
        downloadAudio: "MP3 डाउनलोड",
        downloadSD: "SD डाउनलोड",
        downloadHD: "HD डाउनलोड",
        downloadImage: "छवि डाउनलोड",
        downloading: "डाउनलोड हो रहा है...",
        popularFeatures: "लोकप्रिय सुविधाएं",
        featureNoWatermark: "कोई वॉटरमार्क नहीं",
        featureNoWatermarkDesc: "लोगो के बिना TikTok वीडियो डाउनलोड करें, सामान्य वीडियो, लंबे वीडियो, और स्लाइडशो का समर्थन करता है।",
        featureMP4MP3: "MP4 और MP3 समर्थन",
        featureMP4MP3Desc: "उच्च गुणवत्ता MP4 डाउनलोड करें या तुरंत MP3 ऑडियो निकालें।",
        featureHD: "HD और Full HD गुणवत्ता",
        featureHDDesc: "उपलब्ध होने पर मूल 720p/1080p/2K गुणवत्ता रखें।",
        featureSlideshow: "स्लाइडशो डाउनलोडर",
        featureSlideshowDesc: "TikTok स्लाइडशो को वीडियो या व्यक्तिगत फोटो के रूप में डाउनलोड करें।",
        featureFast: "तेज़ और असीमित",
        featureFastDesc: "कोई सीमा नहीं। बहुत तेज़ डाउनलोड गति।",
        featureSecure: "सुरक्षित और निजी",
        featureSecureDesc: "कोई डेटा संग्रहीत नहीं, पूरी तरह से सुरक्षित।",
        howToUse: "उपयोग कैसे करें",
        step1Title: "TikTok वीडियो लिंक कॉपी करें",
        step1Desc: "TikTok वीडियो लिंक कॉपी करें।",
        step2Title: "ऊपर दिए गए बॉक्स में पेस्ट करें",
        step2Desc: "ऊपर दिए गए बॉक्स में पेस्ट करें।",
        step3Title: "प्रारूप चुनें और तुरंत डाउनलोड करें",
        step3Desc: "प्रारूप चुनें (कोई वॉटरमार्क नहीं, MP4, MP3) और तुरंत डाउनलोड करें।",
        whyChooseTik1s: "Tik1s क्यों चुनें?",
        whyFaster: "अन्य उपकरणों से तेज़",
        whyFasterDesc: "बिजली की तरह तेज़ डाउनलोड गति",
        whyNoWatermark: "कोई वॉटरमार्क नहीं",
        whyNoWatermarkDesc: "TikTok ब्रांडिंग के बिना साफ वीडियो",
        whyMP4MP3: "MP4 और MP3 का समर्थन",
        whyMP4MP3Desc: "वीडियो डाउनलोड करें या ऑडियो निकालें",
        whySlideshow: "स्लाइडशो समर्थन",
        whySlideshowDesc: "स्लाइडशो को वीडियो या फोटो के रूप में डाउनलोड करें",
        whyAllDevices: "सभी उपकरणों पर काम करता है",
        whyAllDevicesDesc: "मोबाइल, टैबलेट, डेस्कटॉप संगत",
        whyFreeSafe: "मुफ्त और सुरक्षित",
        whyFreeSafeDesc: "100% मुफ्त, कोई पंजीकरण नहीं, पूरी तरह से सुरक्षित",
        faqTitle: "अक्सर पूछे जाने वाले प्रश्न",
        faq1Question: "क्या Tik1s मुफ्त है?",
        faq1Answer: "हाँ। Tik1s पूरी तरह से मुफ्त है। कोई छिपी फीस नहीं, कोई प्रीमियम टियर नहीं, और कोई रजिस्ट्रेशन जरूरी नहीं। आप जितने चाहें TikTok वीडियो व्यक्तिगत उपयोग के लिए मुफ्त में डाउनलोड कर सकते हैं।",
        faq2Question: "क्या मैं वॉटरमार्क के बिना डाउनलोड कर सकता हूँ?",
        faq2Answer: "हाँ। Tik1s से डाउनलोड किए गए सभी वीडियो बिना TikTok वॉटरमार्क के मिलते हैं। लिंक पेस्ट करें और SD या HD चुनें—आउटपुट फाइल साफ होगी और व्यक्तिगत उपयोग के लिए तैयार।",
        faq3Question: "क्या आप डाउनलोड किए गए वीडियो संग्रहीत करते हैं?",
        faq3Answer: "नहीं। हम आपके डाउनलोड किए गए वीडियो या पेस्ट किए गए URL स्टोर नहीं करते। प्रक्रिया अनाम है और हम कोई लॉग नहीं रखते। आपकी गोपनीयता हमारे लिए महत्वपूर्ण है।",
        faq4Question: "क्या मैं स्लाइडशो डाउनलोड कर सकता हूँ?",
        faq4Answer: "हाँ। Tik1s TikTok स्लाइडशो (फोटो कैरोसेल) सपोर्ट करता है। आप उन्हें एक वीडियो फाइल या अलग-अलग इमेज के रूप में डाउनलोड कर सकते हैं।",
        faq5Question: "क्या मैं MP3 ऑडियो डाउनलोड कर सकता हूँ?",
        faq5Answer: "हाँ। TikTok लिंक पेस्ट करने के बाद \"Download MP3\" विकल्प से वीडियो का सिर्फ ऑडियो निकाल सकते हैं। यह संगीत या वॉयसओवर सेव करने के लिए उपयोगी है।",
        faq6Question: "क्या मैं इसे किसी भी उपकरण पर उपयोग कर सकता हूँ?",
        faq6Answer: "हाँ। Tik1s डेस्कटॉप, टैबलेट और फोन पर ब्राउज़र में काम करता है। कोई ऐप इंस्टॉल करने की जरूरत नहीं—बस साइट खोलें, लिंक पेस्ट करें और डाउनलोड करें।",
        faq7Question: "क्या वीडियो गुणवत्ता कम होती है?",
        faq7Answer: "नहीं। हम स्रोत से उपलब्ध सर्वोत्तम गुणवत्ता में वीडियो देते हैं। HD उपलब्ध होने पर आप 720p या 1080p के लिए HD चुन सकते हैं। हम वीडियो को कम्प्रेस या डाउनग्रेड नहीं करते।",
        faq8Question: "क्या मुझे एक ऐप इंस्टॉल करने की आवश्यकता है?",
        faq8Answer: "नहीं। Tik1s एक वेब-आधारित टूल है। आपको बस ब्राउज़र और इंटरनेट चाहिए। इससे डिवाइस साफ रहती है और बिना कुछ इंस्टॉल किए किसी भी डिवाइस से उपयोग कर सकते हैं।",
        faq9Question: "क्या मैं निजी वीडियो डाउनलोड कर सकता हूँ?",
        faq9Answer: "नहीं। सिर्फ पब्लिक TikTok वीडियो डाउनलोड हो सकते हैं। प्राइवेट या दोस्तों-वाली वीडियो हमारी सेवा से एक्सेसिबल नहीं हैं, TikTok की विजिबिलिटी सेटिंग्स के अनुसार।",
        faq10Question: "क्या आप CapCut टेम्पलेट्स का समर्थन करते हैं?",
        faq10Answer: "अभी तक नहीं। हम अभी स्टैंडर्ड TikTok वीडियो, लंबे वीडियो और स्लाइडशो पर फोकस करते हैं। CapCut टेम्पलेट सपोर्ट भविष्य में जोड़ा जा सकता है।",
        allRightsReserved: "सभी अधिकार सुरक्षित।",
        privacy: "गोपनीयता नीति",
        terms: "सेवा की शर्तें",
        home: "होम",
        blog: "ब्लॉग",
        about: "हमारे बारे में"
    },
    vi: {
        title: "TikTok Video Downloader – Tải Video TikTok Không Watermark (Miễn Phí, Nhanh, HD)",
        subtitle: "Tải bất kỳ video TikTok nào chất lượng cao không watermark. Nhanh, miễn phí, và hỗ trợ MP4, MP3, và slideshow.",
        inputPlaceholder: "Dán link video TikTok vào đây…",
        pasteBtn: "Dán",
        downloadVideo: "Tải MP4",
        downloadAudio: "Tải MP3",
        downloadSD: "Tải SD",
        downloadHD: "Tải HD",
        downloadImage: "Tải Ảnh",
        downloading: "Đang tải...",
        popularFeatures: "Tính Năng Phổ Biến",
        featureNoWatermark: "Không Watermark",
        featureNoWatermarkDesc: "Tải video TikTok không logo, hỗ trợ video thường, video dài, và slideshow.",
        featureMP4MP3: "Hỗ Trợ MP4 & MP3",
        featureMP4MP3Desc: "Tải MP4 chất lượng cao hoặc trích xuất MP3 ngay lập tức.",
        featureHD: "Chất Lượng HD & Full HD",
        featureHDDesc: "Giữ nguyên chất lượng 720p/1080p/2K khi có sẵn.",
        featureSlideshow: "Tải Slideshow",
        featureSlideshowDesc: "Tải slideshow TikTok dưới dạng video hoặc ảnh riêng lẻ.",
        featureFast: "Nhanh & Không Giới Hạn",
        featureFastDesc: "Không giới hạn. Tốc độ tải rất nhanh.",
        featureSecure: "An Toàn & Riêng Tư",
        featureSecureDesc: "Không lưu trữ dữ liệu, hoàn toàn bảo mật.",
        howToUse: "Cách Sử Dụng",
        step1Title: "Sao chép link video TikTok",
        step1Desc: "Sao chép link video TikTok.",
        step2Title: "Dán vào ô phía trên",
        step2Desc: "Dán vào ô phía trên.",
        step3Title: "Chọn định dạng và tải ngay",
        step3Desc: "Chọn định dạng (Không Watermark, MP4, MP3) và tải ngay lập tức.",
        whyChooseTik1s: "Tại Sao Chọn Tik1s?",
        whyFaster: "Nhanh hơn các công cụ khác",
        whyFasterDesc: "Tốc độ tải cực nhanh",
        whyNoWatermark: "Không watermark",
        whyNoWatermarkDesc: "Video sạch không logo TikTok",
        whyMP4MP3: "Hỗ trợ MP4 & MP3",
        whyMP4MP3Desc: "Tải video hoặc trích xuất audio",
        whySlideshow: "Hỗ trợ slideshow",
        whySlideshowDesc: "Tải slideshow dưới dạng video hoặc ảnh",
        whyAllDevices: "Hoạt động trên mọi thiết bị",
        whyAllDevicesDesc: "Tương thích mobile, tablet, desktop",
        whyFreeSafe: "Miễn phí & an toàn",
        whyFreeSafeDesc: "100% miễn phí, không cần đăng ký, hoàn toàn bảo mật",
        faqTitle: "Câu Hỏi Thường Gặp",
        faq1Question: "Tik1s có miễn phí không?",
        faq1Answer: "Có. Tik1s hoàn toàn miễn phí. Không phí ẩn, không gói premium, không cần đăng ký. Bạn có thể tải bao nhiêu video TikTok tùy thích cho mục đích cá nhân mà không mất phí.",
        faq2Question: "Tôi có thể tải không watermark không?",
        faq2Answer: "Có. Mọi video tải qua Tik1s đều không có watermark TikTok. Chỉ cần dán link và chọn Tải SD hoặc HD—file xuất ra sẽ sạch và sẵn sàng lưu hoặc dùng cho cá nhân.",
        faq3Question: "Bạn có lưu trữ video đã tải không?",
        faq3Answer: "Không. Chúng tôi không lưu video bạn tải hay URL bạn dán. Quá trình ẩn danh và chúng tôi không lưu log liên kết hoạt động với bạn. Quyền riêng tư của bạn được chúng tôi coi trọng.",
        faq4Question: "Tôi có thể tải slideshow không?",
        faq4Answer: "Có. Tik1s hỗ trợ slideshow TikTok (carousel ảnh). Bạn có thể tải dưới dạng một file video hoặc từng ảnh riêng tùy nhu cầu. Cách làm vẫn là dán link và tải.",
        faq5Question: "Tôi có thể tải MP3 không?",
        faq5Answer: "Có. Dùng tùy chọn \"Tải MP3\" sau khi dán link TikTok để chỉ trích xuất âm thanh. Tiện khi bạn muốn lưu nhạc hoặc giọng nói từ clip TikTok mà không cần file video.",
        faq6Question: "Tôi có thể dùng trên mọi thiết bị không?",
        faq6Answer: "Có. Tik1s chạy trên trình duyệt ở máy tính, tablet và điện thoại. Không cần cài app—chỉ cần mở trang web, dán link và tải. Nên dùng trình duyệt hiện đại để trải nghiệm tốt nhất.",
        faq7Question: "Chất lượng video có giảm không?",
        faq7Answer: "Không. Chúng tôi giao video ở chất lượng tốt nhất mà nguồn cung cấp. Khi có HD, bạn chọn tùy chọn HD để nhận 720p hoặc 1080p. Chúng tôi không nén hay hạ chất lượng thêm.",
        faq8Question: "Tôi có cần cài app không?",
        faq8Answer: "Không. Tik1s là công cụ dùng trên web. Bạn chỉ cần trình duyệt và kết nối mạng. Nhờ vậy thiết bị gọn và bạn dùng được từ bất kỳ máy nào mà không cần cài đặt gì.",
        faq9Question: "Tôi có thể tải video riêng tư không?",
        faq9Answer: "Không. Chỉ video TikTok công khai mới tải được. Video riêng tư hoặc chỉ bạn bè không thể truy cập qua dịch vụ của chúng tôi, phù hợp với cài đặt hiển thị của TikTok.",
        faq10Question: "Bạn có hỗ trợ template CapCut không?",
        faq10Answer: "Chưa. Hiện chúng tôi tập trung vào video TikTok thường, video dài và slideshow. Hỗ trợ link template CapCut có thể được thêm trong tương lai. Xem Blog hoặc trang Giới thiệu để cập nhật.",
        allRightsReserved: "Bảo lưu mọi quyền.",
        privacy: "Chính Sách Bảo Mật",
        terms: "Điều Khoản Sử Dụng",
        home: "Trang chủ",
        blog: "Blog",
        about: "Giới thiệu"
    },
    id: {
        title: "Pengunduh Video TikTok – Unduh Video TikTok Tanpa Watermark (Gratis, Cepat, HD)",
        subtitle: "Unduh video TikTok apa pun dalam kualitas tinggi tanpa watermark. Cepat, gratis, dan mendukung MP4, MP3, dan slideshow.",
        inputPlaceholder: "Tempel URL video TikTok di sini…",
        pasteBtn: "Tempel",
        downloadVideo: "Unduh MP4",
        downloadAudio: "Unduh MP3",
        downloadSD: "Unduh SD",
        downloadHD: "Unduh HD",
        downloadImage: "Unduh Gambar",
        downloading: "Mengunduh...",
        popularFeatures: "Fitur Populer",
        featureNoWatermark: "Tanpa Watermark",
        featureNoWatermarkDesc: "Unduh video TikTok tanpa logo, mendukung video normal, video panjang, dan slideshow.",
        featureMP4MP3: "Dukungan MP4 & MP3",
        featureMP4MP3Desc: "Unduh MP4 berkualitas tinggi atau ekstrak audio MP3 secara instan.",
        featureHD: "Kualitas HD & Full HD",
        featureHDDesc: "Pertahankan kualitas 720p/1080p/2K asli saat tersedia.",
        featureSlideshow: "Pengunduh Slideshow",
        featureSlideshowDesc: "Unduh slideshow TikTok sebagai video atau foto individual.",
        featureFast: "Cepat & Tanpa Batas",
        featureFastDesc: "Tidak ada batas. Kecepatan unduh sangat cepat.",
        featureSecure: "Aman & Privat",
        featureSecureDesc: "Tidak ada data yang disimpan, sepenuhnya aman.",
        howToUse: "Cara Menggunakan",
        step1Title: "Salin tautan video TikTok",
        step1Desc: "Salin tautan video TikTok.",
        step2Title: "Tempel ke kotak di atas",
        step2Desc: "Tempel ke kotak di atas.",
        step3Title: "Pilih format dan unduh segera",
        step3Desc: "Pilih format (Tanpa Watermark, MP4, MP3) dan unduh segera.",
        whyChooseTik1s: "Mengapa Pilih Tik1s?",
        whyFaster: "Lebih cepat dari alat lain",
        whyFasterDesc: "Kecepatan unduh sangat cepat",
        whyNoWatermark: "Tanpa watermark",
        whyNoWatermarkDesc: "Video bersih tanpa branding TikTok",
        whyMP4MP3: "Mendukung MP4 & MP3",
        whyMP4MP3Desc: "Unduh video atau ekstrak audio",
        whySlideshow: "Dukungan slideshow",
        whySlideshowDesc: "Unduh slideshow sebagai video atau foto",
        whyAllDevices: "Bekerja di semua perangkat",
        whyAllDevicesDesc: "Kompatibel dengan mobile, tablet, desktop",
        whyFreeSafe: "Gratis & aman",
        whyFreeSafeDesc: "100% gratis, tidak perlu registrasi, sepenuhnya aman",
        faqTitle: "Pertanyaan yang Sering Diajukan",
        faq1Question: "Apakah Tik1s gratis?",
        faq1Answer: "Ya. Tik1s sepenuhnya gratis. Tidak ada biaya tersembunyi, tidak ada tier premium, dan tidak perlu registrasi. Anda bisa mengunduh video TikTok sebanyak yang Anda butuhkan untuk penggunaan pribadi tanpa bayar.",
        faq2Question: "Bisakah saya mengunduh tanpa watermark?",
        faq2Answer: "Ya. Semua video yang diunduh lewat Tik1s tanpa watermark TikTok. Cukup tempel link dan pilih Unduh SD atau HD—file hasil akan bersih dan siap disimpan atau dibagikan untuk penggunaan pribadi.",
        faq3Question: "Apakah Anda menyimpan video yang diunduh?",
        faq3Answer: "Tidak. Kami tidak menyimpan video yang Anda unduh atau URL yang Anda tempel. Prosesnya anonim dan kami tidak menyimpan log yang mengaitkan aktivitas Anda. Privasi Anda penting bagi kami.",
        faq4Question: "Bisakah saya mengunduh slideshow?",
        faq4Answer: "Ya. Tik1s mendukung slideshow TikTok (carousel foto). Anda bisa mengunduh sebagai satu file video atau sebagai gambar terpisah, tergantung kebutuhan. Alurnya tetap: tempel link lalu unduh.",
        faq5Question: "Bisakah saya mengunduh audio MP3?",
        faq5Answer: "Ya. Gunakan opsi \"Unduh MP3\" setelah menempel link TikTok untuk mengekstrak hanya audio dari video. Berguna untuk menyimpan musik atau narasi dari klip TikTok tanpa menyimpan file video.",
        faq6Question: "Bisakah saya menggunakannya di perangkat apa pun?",
        faq6Answer: "Ya. Tik1s berjalan di browser di desktop, tablet, dan ponsel. Tidak perlu instal aplikasi—cukup buka situs, tempel link, dan unduh. Kami sarankan browser modern untuk pengalaman terbaik.",
        faq7Question: "Apakah kualitas video berkurang?",
        faq7Answer: "Tidak. Kami menyediakan video dalam kualitas terbaik yang tersedia dari sumber. Jika HD tersedia, Anda bisa pilih opsi HD untuk 720p atau 1080p. Kami tidak mengompresi atau menurunkan kualitas di luar yang diberikan TikTok.",
        faq8Question: "Apakah saya perlu menginstal aplikasi?",
        faq8Answer: "Tidak. Tik1s adalah alat berbasis web. Anda hanya butuh browser dan koneksi internet. Perangkat Anda tetap ringan dan Anda bisa memakai alat yang sama dari perangkat mana pun tanpa instal apa pun.",
        faq9Question: "Bisakah saya mengunduh video privat?",
        faq9Answer: "Tidak. Hanya video TikTok yang publik yang bisa diunduh. Video privat atau hanya-teman tidak dapat diakses oleh layanan kami, sesuai pengaturan visibilitas TikTok dan penghormatan kepada kreator.",
        faq10Question: "Apakah Anda mendukung template CapCut?",
        faq10Answer: "Belum. Saat ini kami fokus pada video TikTok standar, video panjang, dan slideshow. Dukungan link template CapCut mungkin ditambahkan di update mendatang. Cek blog atau halaman About untuk info.",
        allRightsReserved: "Hak cipta dilindungi.",
        privacy: "Kebijakan Privasi",
        terms: "Ketentuan Layanan",
        home: "Beranda",
        blog: "Blog",
        about: "Tentang"
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

