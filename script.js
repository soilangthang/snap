// DOM Elements
const videoUrlInput = document.getElementById('videoUrl');
const downloadBtn = document.getElementById('downloadBtn');
const downloadMP3 = document.getElementById('downloadMP3');
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
    if (!downloadSD || !downloadHD) return;
    
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
    initLanguageSwitcher();
    initFAQ();
    initPasteButton();
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
        downloadSD: "Download SD",
        downloadHD: "Download HD",
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
        terms: "Terms of Service"
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
        terms: "सेवा की शर्तें"
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
        terms: "Điều Khoản Sử Dụng"
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
        terms: "Ketentuan Layanan"
    }
};

let currentLang = localStorage.getItem('language') || 'en';

function changeLanguage(lang) {
    currentLang = lang;
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

