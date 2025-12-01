// ============================================
// Modern TikTok Downloader - Main Script
// Optimized for performance and UX
// ============================================

// DOM Elements
const videoUrlInput = document.getElementById('videoUrl');
const pasteBtn = document.getElementById('pasteBtn');
const downloadMP4 = document.getElementById('downloadMP4');
const downloadMP3 = document.getElementById('downloadMP3');
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

// State
let currentVideoData = {
    video_url: '',
    video_url_hd: '',
    title: '',
    author: '',
    video_id: '',
    filename: ''
};

let downloadStartTime = 0;
let lastLoaded = 0;
let lastTime = 0;

// ============================================
// Utility Functions
// ============================================

function generateFilename(videoId, title, extension = 'mp4') {
    let sanitizedTitle = '';
    if (title && title !== 'TikTok Video') {
        sanitizedTitle = title
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/gi, '')
            .replace(/\s+/g, '_')
            .substring(0, 50)
            .toLowerCase();
    }
    
    if (videoId) {
        if (sanitizedTitle) {
            return `tiktok_${videoId}_${sanitizedTitle}.${extension}`;
        }
        return `tiktok_${videoId}.${extension}`;
    }
    
    if (sanitizedTitle) {
        return `tiktok_${sanitizedTitle}.${extension}`;
    }
    
    return `tiktok_video.${extension}`;
}

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    resultSection.style.display = 'none';
    hideProgress();
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function showProgress() {
    progressContainer.style.display = 'block';
}

function hideProgress() {
    progressContainer.style.display = 'none';
}

function updateProgress(percent, text) {
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    
    if (progressText) {
        progressText.textContent = text || (typeof t !== 'undefined' ? t('downloading') : 'Downloading...');
    }
    
    if (progressPercent) {
        progressPercent.textContent = Math.round(percent) + '%';
    }
}

function setLoading(loading) {
    if (downloadMP4) {
        downloadMP4.disabled = loading;
        downloadMP4.style.opacity = loading ? '0.6' : '1';
    }
    if (downloadMP3) {
        downloadMP3.disabled = loading;
        downloadMP3.style.opacity = loading ? '0.6' : '1';
    }
}

// ============================================
// Event Listeners
// ============================================

// Paste button
if (pasteBtn) {
    pasteBtn.addEventListener('click', async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text) {
                videoUrlInput.value = text;
                videoUrlInput.focus();
                
                // Visual feedback
                pasteBtn.textContent = '✓';
                setTimeout(() => {
                    pasteBtn.textContent = typeof t !== 'undefined' ? t('pasteLink') : 'Paste Link';
                }, 1000);
            }
        } catch (err) {
            videoUrlInput.focus();
            videoUrlInput.select();
        }
    });
}

// Enter key to submit
if (videoUrlInput) {
    videoUrlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleDownload('mp4');
        }
    });
    
    // Auto-focus on load
    videoUrlInput.focus();
}

// Download MP4 button
if (downloadMP4) {
    downloadMP4.addEventListener('click', () => handleDownload('mp4'));
}

// Download MP3 button
if (downloadMP3) {
    downloadMP3.addEventListener('click', () => handleDownload('mp3'));
}

// FAQ Toggle
document.querySelectorAll('.faq-question').forEach(question => {
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

// ============================================
// Main Download Handler
// ============================================

async function handleDownload(format = 'mp4') {
    const url = videoUrlInput.value.trim();
    
    // Validate URL
    if (!url) {
        showError(typeof t !== 'undefined' ? 'Please enter a TikTok URL' : 'Please enter a TikTok URL');
        return;
    }
    
    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
        showError(typeof t !== 'undefined' ? 'Invalid URL. Please enter a valid TikTok link' : 'Invalid URL. Please enter a valid TikTok link');
        return;
    }
    
    // Hide previous results/errors
    resultSection.style.display = 'none';
    hideError();
    
    // Show loading
    setLoading(true);
    
    try {
        // For MP3, we need to get video first, then convert
        if (format === 'mp3') {
            await handleMP3Download(url);
        } else {
            await handleMP4Download(url);
        }
    } catch (error) {
        console.error('Error:', error);
        showError(typeof t !== 'undefined' ? 'An error occurred. Please try again later.' : 'An error occurred. Please try again later.');
    } finally {
        setLoading(false);
    }
}

// Handle MP4 download
async function handleMP4Download(url) {
    showProgress();
    updateProgress(0, 'Fetching video info...');
    
    const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
    });
    
    const data = await response.json();
    
    if (data.success) {
        // Save video data
        currentVideoData = {
            video_url: data.video_url || '',
            video_url_hd: data.video_url_hd || data.video_url || '',
            title: data.title || 'TikTok Video',
            author: data.author || 'Unknown',
            video_id: data.video_id || '',
            filename: generateFilename(data.video_id, data.title, 'mp4')
        };
        
        // Display video info
        if (videoTitle) videoTitle.textContent = currentVideoData.title;
        if (videoAuthor) videoAuthor.textContent = currentVideoData.author;
        
        if (data.thumbnail && videoThumbnail) {
            videoThumbnail.src = data.thumbnail;
            videoThumbnail.style.display = 'block';
            videoThumbnail.onerror = function() {
                this.style.display = 'none';
            };
        }
        
        if (data.author_avatar && authorAvatar) {
            authorAvatar.src = data.author_avatar;
            authorAvatar.style.display = 'block';
            authorAvatar.onerror = function() {
                this.style.display = 'none';
            };
        }
        
        // Setup download buttons
        setupDownloadButtons();
        
        // Show result
        resultSection.style.display = 'block';
        hideProgress();
        
        // Scroll to result
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        hideProgress();
        showError(data.error || 'Unable to download video. Please try again.');
    }
}

// Handle MP3 download (convert video to audio)
async function handleMP3Download(url) {
    // First get video URL
    showProgress();
    updateProgress(0, 'Fetching video...');
    
    const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url })
    });
    
    const data = await response.json();
    
    if (data.success) {
        const videoUrl = data.video_url_hd || data.video_url;
        
        // Show converting message
        updateProgress(50, 'Converting to MP3...');
        
        // For now, download video and let user know MP3 conversion
        // In production, you'd use a backend service to convert video to MP3
        showError('MP3 conversion feature coming soon! For now, please download the video and convert it using an audio converter.');
        hideProgress();
        
        // TODO: Implement actual MP3 conversion
        // This would require a backend API endpoint that converts video to audio
    } else {
        hideProgress();
        showError(data.error || 'Unable to download video. Please try again.');
    }
}

// Setup download buttons
function setupDownloadButtons() {
    if (downloadSD) {
        downloadSD.onclick = () => {
            if (currentVideoData.video_url) {
                downloadVideoAsBlob(currentVideoData.video_url, currentVideoData.filename);
            }
        };
    }
    
    if (downloadHD) {
        downloadHD.onclick = () => {
            const hdUrl = currentVideoData.video_url_hd || currentVideoData.video_url;
            const hdFilename = currentVideoData.filename.replace('.mp4', '_HD.mp4');
            if (hdUrl) {
                downloadVideoAsBlob(hdUrl, hdFilename);
            }
        };
    }
    
    if (downloadOther) {
        downloadOther.onclick = () => {
            videoUrlInput.value = '';
            resultSection.style.display = 'none';
            hideError();
            videoUrlInput.focus();
        };
    }
}

// Download video as blob
async function downloadVideoAsBlob(videoUrl, filename) {
    try {
        setLoading(true);
        showProgress();
        updateProgress(0, 'Connecting...');
        
        downloadStartTime = Date.now();
        lastLoaded = 0;
        lastTime = downloadStartTime;
        
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
            hideProgress();
            
            // Fallback: direct download
            const a = document.createElement('a');
            a.href = videoUrl;
            a.download = filename;
            a.target = '_blank';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            setTimeout(() => {
                hideProgress();
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
        
        updateProgress(0, 'Downloading...');
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            chunks.push(value);
            loaded += value.length;
            
            let percent = 0;
            if (total > 0) {
                percent = Math.min(Math.round((loaded / total) * 100), 100);
            } else {
                estimatedPercent = Math.min(estimatedPercent + 2, 95);
                percent = estimatedPercent;
            }
            
            updateProgress(percent, 'Downloading...');
            
            lastLoaded = loaded;
            lastTime = Date.now();
        }
        
        updateProgress(100, 'Saving file...');
        
        const blob = new Blob(chunks, { type: 'video/mp4' });
        const blobUrl = window.URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        
        setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(a);
            hideProgress();
            setLoading(false);
            updateProgress(0, '');
        }, 100);
        
    } catch (error) {
        console.error('Download error:', error);
        hideProgress();
        
        let errorMsg = 'Error downloading video';
        if (error.message.includes('network') || error.message.includes('Network')) {
            errorMsg = 'Network connection error. Please check your connection and try again.';
        } else if (error.message.includes('server')) {
            errorMsg = 'Server error. Please try again later.';
        }
        
        showError(errorMsg);
        setLoading(false);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    // Focus input on load
    if (videoUrlInput) {
        videoUrlInput.focus();
    }
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
});

