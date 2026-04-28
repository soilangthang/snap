// DOM Elements
const videoUrlInput = document.getElementById('videoUrl');
const downloadBtn = document.getElementById('downloadBtn');
const primaryActionText = downloadBtn ? downloadBtn.querySelector('span') : null;
const resultSection = document.getElementById('resultSection');
const errorMessage = document.getElementById('errorMessage');
const requestStatus = document.getElementById('requestStatus');
const requestStatusTitle = document.getElementById('requestStatusTitle');
const requestStatusText = document.getElementById('requestStatusText');
const videoTitle = document.getElementById('videoTitle');
const videoAuthor = document.getElementById('videoAuthor');
const videoThumbnail = document.getElementById('videoThumbnail');
const authorAvatar = document.getElementById('authorAvatar');
const downloadSD = document.getElementById('downloadSD');
const downloadHD = document.getElementById('downloadHD');
const downloadMP3Btn = document.getElementById('downloadMP3');
const downloadImageBtn = document.getElementById('downloadImage');
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

let analyticsPromise = null;

function getActiveLanguage() {
    return window.currentLang || localStorage.getItem('language') || 'en';
}

function ensureAnalytics() {
    if (window.Tik1sAnalytics) {
        return Promise.resolve(window.Tik1sAnalytics);
    }

    if (analyticsPromise) {
        return analyticsPromise;
    }

    analyticsPromise = new Promise((resolve) => {
        const existingScript = document.querySelector('script[data-analytics-loader="true"]');
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.Tik1sAnalytics || null), { once: true });
            existingScript.addEventListener('error', () => resolve(null), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = '/analytics.js';
        script.async = true;
        script.dataset.analyticsLoader = 'true';
        script.onload = () => resolve(window.Tik1sAnalytics || null);
        script.onerror = () => resolve(null);
        document.head.appendChild(script);
    });

    return analyticsPromise;
}

function trackEvent(eventName, params = {}) {
    return ensureAnalytics().then((analytics) => {
        if (!analytics || typeof analytics.track !== 'function') {
            return false;
        }

        return analytics.track(eventName, params);
    });
}

const homepageTranslations = {
    en: {
        title: "TikTok Video Downloader, MP3 Extractor, and Utility Toolkit",
        subtitle: "Paste one public TikTok link and choose what you need: clean video, MP3 audio, cover image, or metadata.",
        heroEyebrow: "Tik1s utility hub",
        heroPoint1: "No watermark video",
        heroPoint2: "MP3 audio",
        heroPoint3: "Cover image",
        heroPoint4: "Link resolver",
        heroPoint5: "Metadata viewer",
        heroPanelTitle: "Start with a TikTok URL",
        heroPanelDesc: "Use the main downloader here, then switch to a dedicated utility if you only need one asset.",
        heroGuidesLink: "Guides",
        openDownloader: "Get Download Options",
        statusLabel: "Status",
        statusIdleTitle: "Paste a TikTok link to load the preview",
        statusIdleDesc: "We will show the preview and file buttons in this same panel.",
        statusLoadingTitle: "Checking the TikTok link",
        statusLoadingDesc: "Please wait while we fetch the preview and available download formats.",
        statusReadyTitle: "Video found. Choose a file below.",
        statusReadyDesc: "The preview is ready in this panel. Pick SD, HD, MP3, or the image.",
        statusDownloadingTitle: "Your file is being prepared",
        statusDownloadingDesc: "Keep this tab open until the browser starts the download.",
        statusErrorTitle: "We could not prepare this link",
        statusErrorDesc: "Check the URL or try another public TikTok post.",
        resultReadyLabel: "Ready",
        resultReadyTitle: "Download options are ready",
        resultReadyDesc: "Choose the format you want from this video.",
        progressConnecting: "Connecting...",
        progressBrowserDownload: "Starting browser download...",
        progressDownloadingVideo: "Downloading video...",
        progressCompleted: "Completed!",
        progressSavingFile: "Saving file...",
        progressDownloadingImage: "Downloading image...",
        progressProcessingImage: "Processing image...",
        progressSavingImage: "Saving image...",
        progressPreparingAudio: "Preparing audio download...",
        progressRequestingAudio: "Requesting audio extraction...",
        progressDownloadingAudio: "Downloading audio...",
        progressSavingAudio: "Saving audio file...",
        progressDefault: "Downloading video...",
        downloadSDTitle: "Standard Definition - Smaller file size, faster download",
        downloadHDTitle: "High Definition - Better quality, larger file size",
        downloadAudioTitle: "Extract and download audio only",
        downloadImageTitle: "Download video thumbnail or cover image",
        videoThumbnailAlt: "Video thumbnail",
        authorAlt: "Author avatar",
        errorEmptyUrl: "Please enter a TikTok URL",
        errorInvalidUrl: "Invalid URL. Please enter a valid TikTok link",
        errorUnableDownloadVideo: "Unable to download video. Please try again.",
        errorGenericTryAgain: "An error occurred. Please try again later.",
        errorVideoDownload: "Error downloading video",
        errorNetwork: "Network connection error. Please check your connection and try again.",
        errorServer: "Server error. Please try again later.",
        errorImageDownload: "Failed to download image. Please try again.",
        errorAudioExtract: "Failed to extract audio. Please try again or download the video and convert it manually.",
        errorThumbnailUnavailable: "Thumbnail not available",
        errorTooManyRequests: "Too many requests. Please try again later.",
        defaultVideoTitle: "TikTok Video",
        defaultAuthor: "Unknown",
        legend1: "Public TikTok links only",
        legend2: "No app install",
        legend3: "Mobile and desktop",
        utilityCoverTitle: "Cover Downloader",
        utilityCoverDesc: "Get the post thumbnail only",
        utilityResolverTitle: "Link Resolver",
        utilityResolverDesc: "Check short links before download",
        utilityMetadataTitle: "Metadata Viewer",
        utilityMetadataDesc: "Inspect title, author, ID, assets",
        utilityMp3GuideTitle: "MP3 Guide",
        utilityMp3GuideDesc: "Fix common audio extraction issues",
        overviewTitle: "Everything on one screen",
        overviewDesc: "Most visitors come to save one asset quickly. The homepage now shows the downloader, helper utilities, and support pages without making people hunt through long sections.",
        overviewTag1: "Main output",
        overviewCard1Title: "Video and audio",
        overviewCard1Desc: "Download public TikTok posts in SD, HD, or MP3 from the same preview state.",
        overviewTag2: "Support utility",
        overviewCard2Title: "Cover, link, metadata",
        overviewCard2Desc: "Open the exact helper page when you do not need the full downloader flow.",
        overviewTag3: "Knowledge",
        overviewCard3Title: "Guides and rights",
        overviewCard3Desc: "Use the resource center for troubleshooting, editorial policy, and responsible use guidance.",
        toolMapTitle: "Choose the right tool fast",
        toolMapDesc: "Each page has one clear job. Start with the action you want, not with a generic menu.",
        toolCard1Label: "Main tool",
        toolCard1Title: "Video Downloader",
        toolCard1Desc: "Best when you want MP4, HD, MP3, or cover from one public TikTok URL.",
        toolCard2Label: "Utility",
        toolCard2Title: "Cover Downloader",
        toolCard2Desc: "Get the public cover image only, without going through a full download workflow.",
        toolCard3Label: "Utility",
        toolCard3Title: "Link Resolver",
        toolCard3Desc: "Check short links, repost links, and public visibility before trying again.",
        toolCard4Label: "Utility",
        toolCard4Title: "Metadata Viewer",
        toolCard4Desc: "Inspect title, author, ID, cover availability, HD availability, and audio state.",
        toolCard5Label: "Guide",
        toolCard5Title: "Download Guide",
        toolCard5Desc: "Use this when a public link fails or quality is lower than expected.",
        toolCard6Label: "Policy",
        toolCard6Title: "Creator Rights",
        toolCard6Desc: "Understand what downloading allows and what rights still remain with the creator.",
        stepsIntro: "Three quick steps, no filler.",
        knowledgeTitle: "Knowledge and trust pages",
        knowledgeDesc: "These pages support usability, trust, and AdSense review quality without crowding the homepage.",
        resourceLink1: "Resource Center",
        resourceLink2: "MP3 Guide",
        resourceLink3: "Editorial Policy",
        resourceLink4: "About Tik1s",
        resourceLink5: "Link Resolver Guide",
        resourceLink6: "Creator Rights",
        faqIntro: "Only the questions that affect actual use.",
        footerBrandDesc: "TikTok utility hub for public downloads, metadata checks, and support guides.",
        creatorRights: "Creator Rights",
        editorialPolicy: "Editorial Policy",
        coverDownloader: "Cover Downloader",
        linkResolver: "Link Resolver",
        metadataViewer: "Metadata Viewer",
        pageTitle: "TikTok Video Downloader - MP4, MP3, Covers, Metadata",
        pageDescription: "Download TikTok videos, extract MP3 audio, save cover images, resolve short links, and inspect metadata from one clean utility hub.",
        changeLanguage: "Change language"
    },
    hi: {
        title: "TikTok Video Downloader, MP3 Extractor aur Utility Toolkit",
        subtitle: "Ek public TikTok link paste kijiye aur jo chahiye woh chuniyé: clean video, MP3 audio, cover image, ya metadata.",
        heroEyebrow: "Tik1s utility hub",
        heroPoint1: "Bina watermark video",
        heroPoint2: "MP3 audio",
        heroPoint3: "Cover image",
        heroPoint4: "Link resolver",
        heroPoint5: "Metadata viewer",
        heroPanelTitle: "TikTok URL se shuru karein",
        heroPanelDesc: "Yahaan main downloader ka upyog karein, aur agar aapko sirf ek asset chahiye to dedicated utility par jaayen.",
        heroGuidesLink: "Guides",
        openDownloader: "Download options dekhen",
        statusLabel: "Status",
        statusIdleTitle: "Preview lane ke liye TikTok link paste karein",
        statusIdleDesc: "Preview aur file buttons isi panel me turant dikhai denge.",
        statusLoadingTitle: "TikTok link check ho raha hai",
        statusLoadingDesc: "Preview aur available formats lane ke liye thoda intezar karein.",
        statusReadyTitle: "Video mil gaya. Niche se file chunen.",
        statusReadyDesc: "Preview isi panel me taiyar hai. SD, HD, MP3 ya image chun sakte hain.",
        statusDownloadingTitle: "Aapki file taiyar ki ja rahi hai",
        statusDownloadingDesc: "Browser download shuru hone tak is tab ko khula rakhein.",
        statusErrorTitle: "Is link ko taiyar nahin kiya ja saka",
        statusErrorDesc: "URL check karein ya koi doosra public TikTok post try karein.",
        resultReadyLabel: "Ready",
        resultReadyTitle: "Download options taiyar hain",
        resultReadyDesc: "Is video se jo format chahiye use chunen.",
        progressConnecting: "Connect kiya ja raha hai...",
        progressBrowserDownload: "Browser download shuru ho raha hai...",
        progressDownloadingVideo: "Video download ho raha hai...",
        progressCompleted: "Poora hua!",
        progressSavingFile: "File save ki ja rahi hai...",
        progressDownloadingImage: "Image download ho rahi hai...",
        progressProcessingImage: "Image process ho rahi hai...",
        progressSavingImage: "Image save ki ja rahi hai...",
        progressPreparingAudio: "Audio download taiyar ho raha hai...",
        progressRequestingAudio: "Audio extraction request bheji ja rahi hai...",
        progressDownloadingAudio: "Audio download ho raha hai...",
        progressSavingAudio: "Audio file save ki ja rahi hai...",
        progressDefault: "Video download ho raha hai...",
        downloadSDTitle: "Standard Definition - chhoti file size, tez download",
        downloadHDTitle: "High Definition - behtar quality, badi file size",
        downloadAudioTitle: "Sirf audio extract karke download karein",
        downloadImageTitle: "Video thumbnail ya cover image download karein",
        videoThumbnailAlt: "Video thumbnail",
        authorAlt: "Author avatar",
        errorEmptyUrl: "Kripya ek TikTok URL darj karein",
        errorInvalidUrl: "Amanay URL. Kripya ek valid TikTok link darj karein",
        errorUnableDownloadVideo: "Video download nahin ho saka. Kripya phir se try karein.",
        errorGenericTryAgain: "Ek error hui. Kripya baad mein phir se try karein.",
        errorVideoDownload: "Video download karte samay error hui",
        errorNetwork: "Network connection error. Kripya apna connection check karke phir se try karein.",
        errorServer: "Server error. Kripya baad mein phir se try karein.",
        errorImageDownload: "Image download nahin ho saki. Kripya phir se try karein.",
        errorAudioExtract: "Audio extract nahin ho saka. Kripya phir se try karein ya video download karke manually convert karein.",
        errorThumbnailUnavailable: "Thumbnail upalabdh nahin hai",
        errorTooManyRequests: "Bahut zyada requests ho gayi hain. Kripya baad mein phir se try karein.",
        defaultVideoTitle: "TikTok Video",
        defaultAuthor: "Unknown",
        legend1: "Sirf public TikTok links",
        legend2: "App install ki zarurat nahin",
        legend3: "Mobile aur desktop",
        utilityCoverTitle: "Cover Downloader",
        utilityCoverDesc: "Sirf post thumbnail lein",
        utilityResolverTitle: "Link Resolver",
        utilityResolverDesc: "Download se pehle short link check karein",
        utilityMetadataTitle: "Metadata Viewer",
        utilityMetadataDesc: "Title, author, ID aur assets dekhein",
        utilityMp3GuideTitle: "MP3 Guide",
        utilityMp3GuideDesc: "Common audio extraction issues theek karein",
        overviewTitle: "Sab kuch ek hi screen par",
        overviewDesc: "Zyadatar visitors ek asset jaldi save karna chahte hain. Homepage ab downloader, helper utilities aur support pages ek jagah dikhata hai.",
        overviewTag1: "Main output",
        overviewCard1Title: "Video aur audio",
        overviewCard1Desc: "Public TikTok posts ko SD, HD, ya MP3 mein ek hi preview state se download karein.",
        overviewTag2: "Support utility",
        overviewCard2Title: "Cover, link, metadata",
        overviewCard2Desc: "Jab full downloader flow ki zarurat na ho to seedha helper page kholen.",
        overviewTag3: "Knowledge",
        overviewCard3Title: "Guides aur rights",
        overviewCard3Desc: "Troubleshooting, editorial policy aur responsible use guidance ke liye resource center dekhein.",
        toolMapTitle: "Sahi tool jaldi chunen",
        toolMapDesc: "Har page ka ek saaf kaam hai. Generic menu ki jagah apne action se shuru karein.",
        toolCard1Label: "Main tool",
        toolCard1Title: "Video Downloader",
        toolCard1Desc: "Jab aapko ek public TikTok URL se MP4, HD, MP3 ya cover chahiye tab yeh sabse sahi hai.",
        toolCard2Label: "Utility",
        toolCard2Title: "Cover Downloader",
        toolCard2Desc: "Pura video flow use kiye bina sirf public cover image lein.",
        toolCard3Label: "Utility",
        toolCard3Title: "Link Resolver",
        toolCard3Desc: "Short links, repost links aur public visibility ko phir se koshish karne se pehle check karein.",
        toolCard4Label: "Utility",
        toolCard4Title: "Metadata Viewer",
        toolCard4Desc: "Title, author, ID, cover availability, HD availability aur audio state dekhein.",
        toolCard5Label: "Guide",
        toolCard5Title: "Download Guide",
        toolCard5Desc: "Yeh tab kaam aata hai jab public link fail ho ya quality expected se kam ho.",
        toolCard6Label: "Policy",
        toolCard6Title: "Creator Rights",
        toolCard6Desc: "Samajhiye ki downloading kya allow karti hai aur kaun se rights creator ke paas rehte hain.",
        stepsIntro: "Teen quick steps, bina filler ke.",
        knowledgeTitle: "Knowledge aur trust pages",
        knowledgeDesc: "Yeh pages homepage ko bhare bina usability, trust aur AdSense review quality ko support karte hain.",
        resourceLink1: "Resource Center",
        resourceLink2: "MP3 Guide",
        resourceLink3: "Editorial Policy",
        resourceLink4: "About Tik1s",
        resourceLink5: "Link Resolver Guide",
        resourceLink6: "Creator Rights",
        faqIntro: "Sirf wahi sawaal jo actual use ko affect karte hain.",
        footerBrandDesc: "Public downloads, metadata checks aur support guides ke liye TikTok utility hub.",
        creatorRights: "Creator Rights",
        editorialPolicy: "Editorial Policy",
        coverDownloader: "Cover Downloader",
        linkResolver: "Link Resolver",
        metadataViewer: "Metadata Viewer",
        pageTitle: "TikTok Video Downloader - MP4, MP3, Covers, Metadata",
        pageDescription: "TikTok videos download karein, MP3 audio extract karein, cover images save karein, short links resolve karein aur metadata inspect karein.",
        changeLanguage: "Bhasha badlein"
    },
    vi: {
        title: "TikTok Video Downloader, Trích Xuất MP3 và Bộ Utility",
        subtitle: "Dán một link TikTok công khai và chọn đúng thứ bạn cần: video sạch, MP3, ảnh cover hoặc metadata.",
        heroEyebrow: "Trung tâm utility Tik1s",
        heroPoint1: "Video không watermark",
        heroPoint2: "Âm thanh MP3",
        heroPoint3: "Ảnh cover",
        heroPoint4: "Bộ giải link",
        heroPoint5: "Trình xem metadata",
        heroPanelTitle: "Bắt đầu với URL TikTok",
        heroPanelDesc: "Dùng downloader chính tại đây, sau đó chuyển sang utility riêng nếu bạn chỉ cần một loại tài nguyên.",
        heroGuidesLink: "Hướng dẫn",
        openDownloader: "Lấy tùy chọn tải xuống",
        statusLabel: "Trạng thái",
        statusIdleTitle: "Dán link TikTok để tải preview",
        statusIdleDesc: "Preview và các nút tải file sẽ hiện ngay trong cùng panel này.",
        statusLoadingTitle: "Đang kiểm tra link TikTok",
        statusLoadingDesc: "Vui lòng đợi trong lúc hệ thống lấy preview và các định dạng có sẵn.",
        statusReadyTitle: "Đã tìm thấy video. Chọn file ở bên dưới.",
        statusReadyDesc: "Preview đã sẵn sàng trong panel này. Bạn có thể chọn SD, HD, MP3 hoặc image.",
        statusDownloadingTitle: "File của bạn đang được chuẩn bị",
        statusDownloadingDesc: "Hãy giữ tab này mở cho đến khi trình duyệt bắt đầu tải xuống.",
        statusErrorTitle: "Không thể chuẩn bị link này",
        statusErrorDesc: "Kiểm tra lại URL hoặc thử một bài TikTok công khai khác.",
        resultReadyLabel: "Sẵn sàng",
        resultReadyTitle: "Tùy chọn tải đã sẵn sàng",
        resultReadyDesc: "Chọn định dạng bạn muốn tải từ video này.",
        progressConnecting: "Đang kết nối...",
        progressBrowserDownload: "Đang bắt đầu tải bằng trình duyệt...",
        progressDownloadingVideo: "Đang tải video...",
        progressCompleted: "Hoàn tất!",
        progressSavingFile: "Đang lưu file...",
        progressDownloadingImage: "Đang tải ảnh...",
        progressProcessingImage: "Đang xử lý ảnh...",
        progressSavingImage: "Đang lưu ảnh...",
        progressPreparingAudio: "Đang chuẩn bị tải audio...",
        progressRequestingAudio: "Đang yêu cầu trích xuất audio...",
        progressDownloadingAudio: "Đang tải audio...",
        progressSavingAudio: "Đang lưu file audio...",
        progressDefault: "Đang tải video...",
        downloadSDTitle: "Độ phân giải tiêu chuẩn - file nhỏ hơn, tải nhanh hơn",
        downloadHDTitle: "Độ phân giải cao - chất lượng tốt hơn, file lớn hơn",
        downloadAudioTitle: "Trích xuất và tải riêng phần âm thanh",
        downloadImageTitle: "Tải thumbnail hoặc ảnh cover của video",
        videoThumbnailAlt: "Ảnh thumbnail video",
        authorAlt: "Ảnh đại diện tác giả",
        errorEmptyUrl: "Vui lòng nhập URL TikTok",
        errorInvalidUrl: "URL không hợp lệ. Vui lòng nhập link TikTok hợp lệ",
        errorUnableDownloadVideo: "Không thể tải video. Vui lòng thử lại.",
        errorGenericTryAgain: "Đã xảy ra lỗi. Vui lòng thử lại sau.",
        errorVideoDownload: "Lỗi khi tải video",
        errorNetwork: "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.",
        errorServer: "Lỗi máy chủ. Vui lòng thử lại sau.",
        errorImageDownload: "Không thể tải ảnh. Vui lòng thử lại.",
        errorAudioExtract: "Không thể trích xuất audio. Vui lòng thử lại hoặc tải video rồi tự chuyển đổi.",
        errorThumbnailUnavailable: "Không có ảnh thumbnail",
        errorTooManyRequests: "Bạn đang thao tác quá nhanh. Vui lòng thử lại sau.",
        defaultVideoTitle: "Video TikTok",
        defaultAuthor: "Không rõ",
        legend1: "Chỉ hỗ trợ link TikTok công khai",
        legend2: "Không cần cài app",
        legend3: "Dùng trên mobile và desktop",
        utilityCoverTitle: "Tải Cover",
        utilityCoverDesc: "Lấy thumbnail của bài đăng",
        utilityResolverTitle: "Giải Link",
        utilityResolverDesc: "Kiểm tra link rút gọn trước khi tải",
        utilityMetadataTitle: "Xem Metadata",
        utilityMetadataDesc: "Xem title, author, ID và các asset",
        utilityMp3GuideTitle: "Hướng dẫn MP3",
        utilityMp3GuideDesc: "Khắc phục lỗi trích xuất audio phổ biến",
        overviewTitle: "Mọi thứ trên một màn hình",
        overviewDesc: "Phần lớn người dùng chỉ muốn lưu nhanh một asset. Trang chủ giờ hiển thị downloader, utility hỗ trợ và các trang hướng dẫn mà không cần cuộn qua nhiều khối.",
        overviewTag1: "Đầu ra chính",
        overviewCard1Title: "Video và audio",
        overviewCard1Desc: "Tải bài đăng TikTok công khai ở SD, HD hoặc MP3 từ cùng một preview.",
        overviewTag2: "Utility hỗ trợ",
        overviewCard2Title: "Cover, link, metadata",
        overviewCard2Desc: "Mở đúng trang helper nếu bạn không cần toàn bộ flow downloader.",
        overviewTag3: "Kiến thức",
        overviewCard3Title: "Hướng dẫn và quyền",
        overviewCard3Desc: "Dùng resource center cho troubleshooting, editorial policy và hướng dẫn sử dụng có trách nhiệm.",
        toolMapTitle: "Chọn đúng tool nhanh hơn",
        toolMapDesc: "Mỗi trang có một nhiệm vụ rõ ràng. Hãy bắt đầu từ việc bạn cần làm, không phải từ một menu chung chung.",
        toolCard1Label: "Tool chính",
        toolCard1Title: "Tải Video",
        toolCard1Desc: "Phù hợp nhất khi bạn muốn MP4, HD, MP3 hoặc cover từ một URL TikTok công khai.",
        toolCard2Label: "Utility",
        toolCard2Title: "Tải Cover",
        toolCard2Desc: "Lấy cover image công khai mà không cần đi qua toàn bộ flow tải video.",
        toolCard3Label: "Utility",
        toolCard3Title: "Giải Link",
        toolCard3Desc: "Kiểm tra link rút gọn, link repost và trạng thái công khai trước khi thử lại.",
        toolCard4Label: "Utility",
        toolCard4Title: "Xem Metadata",
        toolCard4Desc: "Xem title, author, ID, trạng thái cover, HD và audio.",
        toolCard5Label: "Hướng dẫn",
        toolCard5Title: "Hướng dẫn Tải",
        toolCard5Desc: "Dùng trang này khi link công khai bị lỗi hoặc chất lượng thấp hơn mong đợi.",
        toolCard6Label: "Chính sách",
        toolCard6Title: "Quyền Tác Giả",
        toolCard6Desc: "Hiểu việc tải về cho phép điều gì và những quyền nào vẫn thuộc về creator.",
        stepsIntro: "Ba bước nhanh, không dài dòng.",
        knowledgeTitle: "Trang kiến thức và độ tin cậy",
        knowledgeDesc: "Những trang này hỗ trợ trải nghiệm, trust và chất lượng review AdSense mà không làm trang chủ quá chật.",
        resourceLink1: "Resource Center",
        resourceLink2: "Hướng dẫn MP3",
        resourceLink3: "Chính sách biên tập",
        resourceLink4: "Giới thiệu Tik1s",
        resourceLink5: "Hướng dẫn giải link",
        resourceLink6: "Quyền tác giả",
        faqIntro: "Chỉ giữ những câu hỏi ảnh hưởng tới việc sử dụng thực tế.",
        footerBrandDesc: "Trung tâm utility TikTok cho tải xuống công khai, kiểm tra metadata và các hướng dẫn hỗ trợ.",
        creatorRights: "Quyền Tác Giả",
        editorialPolicy: "Chính sách biên tập",
        coverDownloader: "Tải Cover",
        linkResolver: "Giải Link",
        metadataViewer: "Xem Metadata",
        pageTitle: "TikTok Video Downloader - MP4, MP3, Cover, Metadata",
        pageDescription: "Tải video TikTok, trích xuất MP3, lưu cover image, giải link rút gọn và xem metadata từ một utility hub gọn gàng."
    },
    id: {
        title: "TikTok Video Downloader, Ekstraktor MP3, dan Toolkit Utilitas",
        subtitle: "Tempel satu link TikTok publik lalu pilih yang Anda butuhkan: video bersih, audio MP3, cover image, atau metadata.",
        heroEyebrow: "Pusat utilitas Tik1s",
        heroPoint1: "Video tanpa watermark",
        heroPoint2: "Audio MP3",
        heroPoint3: "Cover image",
        heroPoint4: "Resolver tautan",
        heroPoint5: "Penampil metadata",
        heroPanelTitle: "Mulai dengan URL TikTok",
        heroPanelDesc: "Gunakan downloader utama di sini, lalu pindah ke utilitas khusus jika Anda hanya membutuhkan satu aset.",
        heroGuidesLink: "Panduan",
        openDownloader: "Lihat opsi unduhan",
        statusLabel: "Status",
        statusIdleTitle: "Tempel link TikTok untuk memuat preview",
        statusIdleDesc: "Preview dan tombol file akan muncul di panel yang sama ini.",
        statusLoadingTitle: "Sedang memeriksa link TikTok",
        statusLoadingDesc: "Mohon tunggu saat kami mengambil preview dan format unduhan yang tersedia.",
        statusReadyTitle: "Video ditemukan. Pilih file di bawah.",
        statusReadyDesc: "Preview sudah siap di panel ini. Pilih SD, HD, MP3, atau image.",
        statusDownloadingTitle: "File Anda sedang disiapkan",
        statusDownloadingDesc: "Biarkan tab ini tetap terbuka sampai browser memulai unduhan.",
        statusErrorTitle: "Link ini tidak bisa disiapkan",
        statusErrorDesc: "Periksa URL atau coba posting TikTok publik yang lain.",
        resultReadyLabel: "Siap",
        resultReadyTitle: "Opsi unduhan sudah siap",
        resultReadyDesc: "Pilih format yang Anda inginkan dari video ini.",
        progressConnecting: "Sedang menghubungkan...",
        progressBrowserDownload: "Sedang memulai unduhan browser...",
        progressDownloadingVideo: "Sedang mengunduh video...",
        progressCompleted: "Selesai!",
        progressSavingFile: "Sedang menyimpan file...",
        progressDownloadingImage: "Sedang mengunduh gambar...",
        progressProcessingImage: "Sedang memproses gambar...",
        progressSavingImage: "Sedang menyimpan gambar...",
        progressPreparingAudio: "Sedang menyiapkan unduhan audio...",
        progressRequestingAudio: "Sedang meminta ekstraksi audio...",
        progressDownloadingAudio: "Sedang mengunduh audio...",
        progressSavingAudio: "Sedang menyimpan file audio...",
        progressDefault: "Sedang mengunduh video...",
        downloadSDTitle: "Definisi standar - ukuran file lebih kecil, unduhan lebih cepat",
        downloadHDTitle: "Definisi tinggi - kualitas lebih baik, ukuran file lebih besar",
        downloadAudioTitle: "Ekstrak dan unduh audio saja",
        downloadImageTitle: "Unduh thumbnail atau cover image video",
        videoThumbnailAlt: "Thumbnail video",
        authorAlt: "Avatar penulis",
        errorEmptyUrl: "Silakan masukkan URL TikTok",
        errorInvalidUrl: "URL tidak valid. Silakan masukkan tautan TikTok yang valid",
        errorUnableDownloadVideo: "Tidak dapat mengunduh video. Silakan coba lagi.",
        errorGenericTryAgain: "Terjadi kesalahan. Silakan coba lagi nanti.",
        errorVideoDownload: "Kesalahan saat mengunduh video",
        errorNetwork: "Kesalahan koneksi jaringan. Silakan periksa koneksi Anda lalu coba lagi.",
        errorServer: "Kesalahan server. Silakan coba lagi nanti.",
        errorImageDownload: "Gagal mengunduh gambar. Silakan coba lagi.",
        errorAudioExtract: "Gagal mengekstrak audio. Silakan coba lagi atau unduh video lalu konversi secara manual.",
        errorThumbnailUnavailable: "Thumbnail tidak tersedia",
        errorTooManyRequests: "Terlalu banyak permintaan. Silakan coba lagi nanti.",
        defaultVideoTitle: "Video TikTok",
        defaultAuthor: "Tidak diketahui",
        legend1: "Hanya link TikTok publik",
        legend2: "Tanpa instal aplikasi",
        legend3: "Mobile dan desktop",
        utilityCoverTitle: "Cover Downloader",
        utilityCoverDesc: "Ambil thumbnail posting saja",
        utilityResolverTitle: "Link Resolver",
        utilityResolverDesc: "Periksa tautan pendek sebelum mengunduh",
        utilityMetadataTitle: "Metadata Viewer",
        utilityMetadataDesc: "Lihat title, author, ID, dan aset",
        utilityMp3GuideTitle: "Panduan MP3",
        utilityMp3GuideDesc: "Perbaiki masalah ekstraksi audio yang umum",
        overviewTitle: "Semua terlihat dalam satu layar",
        overviewDesc: "Kebanyakan pengunjung hanya ingin menyimpan satu aset dengan cepat. Homepage sekarang menampilkan downloader, utilitas pendukung, dan halaman bantuan tanpa membuat pengguna harus mencari terlalu jauh.",
        overviewTag1: "Output utama",
        overviewCard1Title: "Video dan audio",
        overviewCard1Desc: "Unduh posting TikTok publik dalam SD, HD, atau MP3 dari preview yang sama.",
        overviewTag2: "Utilitas pendukung",
        overviewCard2Title: "Cover, tautan, metadata",
        overviewCard2Desc: "Buka helper page yang tepat saat Anda tidak memerlukan flow downloader penuh.",
        overviewTag3: "Pengetahuan",
        overviewCard3Title: "Panduan dan hak",
        overviewCard3Desc: "Gunakan resource center untuk troubleshooting, editorial policy, dan panduan penggunaan yang bertanggung jawab.",
        toolMapTitle: "Pilih tool yang tepat lebih cepat",
        toolMapDesc: "Setiap halaman punya satu fungsi yang jelas. Mulai dari tindakan yang Anda butuhkan, bukan dari menu generik.",
        toolCard1Label: "Tool utama",
        toolCard1Title: "Video Downloader",
        toolCard1Desc: "Paling cocok saat Anda ingin MP4, HD, MP3, atau cover dari satu URL TikTok publik.",
        toolCard2Label: "Utilitas",
        toolCard2Title: "Cover Downloader",
        toolCard2Desc: "Ambil cover image publik saja tanpa melalui seluruh alur download video.",
        toolCard3Label: "Utilitas",
        toolCard3Title: "Link Resolver",
        toolCard3Desc: "Periksa tautan pendek, tautan repost, dan status publik sebelum mencoba lagi.",
        toolCard4Label: "Utilitas",
        toolCard4Title: "Metadata Viewer",
        toolCard4Desc: "Lihat title, author, ID, status cover, status HD, dan status audio.",
        toolCard5Label: "Panduan",
        toolCard5Title: "Panduan Download",
        toolCard5Desc: "Gunakan ini saat link publik gagal atau kualitas lebih rendah dari yang diharapkan.",
        toolCard6Label: "Kebijakan",
        toolCard6Title: "Hak Kreator",
        toolCard6Desc: "Pahami apa yang diizinkan dengan mengunduh dan hak apa yang tetap dimiliki kreator.",
        stepsIntro: "Tiga langkah cepat, tanpa filler.",
        knowledgeTitle: "Halaman pengetahuan dan kepercayaan",
        knowledgeDesc: "Halaman ini mendukung kegunaan, trust, dan kualitas review AdSense tanpa membuat homepage terlalu padat.",
        resourceLink1: "Resource Center",
        resourceLink2: "Panduan MP3",
        resourceLink3: "Kebijakan Editorial",
        resourceLink4: "Tentang Tik1s",
        resourceLink5: "Panduan resolver link",
        resourceLink6: "Hak Kreator",
        faqIntro: "Hanya pertanyaan yang benar-benar memengaruhi penggunaan.",
        footerBrandDesc: "Pusat utilitas TikTok untuk unduhan publik, pemeriksaan metadata, dan panduan bantuan.",
        creatorRights: "Hak Kreator",
        editorialPolicy: "Kebijakan Editorial",
        coverDownloader: "Cover Downloader",
        linkResolver: "Link Resolver",
        metadataViewer: "Metadata Viewer",
        pageTitle: "TikTok Video Downloader - MP4, MP3, Cover, Metadata",
        pageDescription: "Unduh video TikTok, ekstrak audio MP3, simpan cover image, selesaikan tautan pendek, dan lihat metadata dari satu utility hub yang rapi."
    }
};

let currentVideoUrl = ''; // For copy link functionality
let downloadStartTime = 0;
let lastLoaded = 0;
let lastTime = 0;
let resultHighlightTimer = null;
let currentRequestState = 'idle';
let currentRequestDescription = '';

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
            trackEvent('asset_download_start', {
                tool: 'homepage_downloader',
                asset_type: 'video_sd',
                site_language: getActiveLanguage(),
            });
            downloadVideoAsBlob(currentVideoData.video_url, currentVideoData.filename, downloadSD);
        }
    };
    
    // Download HD - High Definition (better quality, larger file)
    downloadHD.onclick = () => {
        const hdUrl = currentVideoData.video_url_hd || currentVideoData.video_url;
        const hdFilename = currentVideoData.filename.replace('.mp4', '_HD.mp4');
        if (hdUrl) {
            trackEvent('asset_download_start', {
                tool: 'homepage_downloader',
                asset_type: 'video_hd',
                site_language: getActiveLanguage(),
            });
            downloadVideoAsBlob(hdUrl, hdFilename, downloadHD);
        }
    };
    
    // Download MP3 - Extract audio from video
    if (downloadMP3Btn) {
        downloadMP3Btn.onclick = () => {
            const videoUrl = currentVideoData.video_url_hd || currentVideoData.video_url;
            if (videoUrl) {
                trackEvent('asset_download_start', {
                    tool: 'homepage_downloader',
                    asset_type: 'audio_mp3',
                    site_language: getActiveLanguage(),
                });
                downloadAudioFromVideo(videoUrl, downloadMP3Btn);
            }
        };
    }
    
    // Download Image - Download thumbnail/cover image
    if (downloadImageBtn) {
        downloadImageBtn.onclick = () => {
            if (currentVideoData.thumbnail) {
                trackEvent('asset_download_start', {
                    tool: 'homepage_downloader',
                    asset_type: 'cover_image',
                    site_language: getActiveLanguage(),
                });
                downloadImage(currentVideoData.thumbnail, downloadImageBtn);
            } else {
                showError(getTranslation('errorThumbnailUnavailable', 'Thumbnail not available'), { preserveResult: true });
                return;
                const errorMsgs = {
                    en: 'Thumbnail not available',
                    hi: 'थंबनेल उपलब्ध नहीं है',
                    vi: 'Không có ảnh thumbnail',
                    id: 'Thumbnail tidak tersedia'
                };
                showError(errorMsgs[currentLang] || errorMsgs.en, { preserveResult: true });
            }
        };
    }
}

function getTranslation(key, fallback = '') {
    if (typeof translations === 'undefined' || !translations[currentLang]) {
        return fallback;
    }

    return translations[currentLang][key] || fallback;
}

function localizeApiError(message, fallbackKey = 'errorGenericTryAgain') {
    if (!message) {
        return getTranslation(fallbackKey, 'An error occurred. Please try again later.');
    }

    const normalized = String(message).trim();
    const keyMap = {
        'Please enter a URL': 'errorEmptyUrl',
        'URL must start with http:// or https://': 'errorInvalidUrl',
        'Invalid URL. Please enter a TikTok link': 'errorInvalidUrl',
        'Invalid URL. Please enter a valid TikTok link': 'errorInvalidUrl',
        'Unable to download video. Please try again.': 'errorUnableDownloadVideo',
        'An error occurred. Please try again later.': 'errorGenericTryAgain',
        'Failed to download image': 'errorImageDownload',
        'Failed to download image. Please try again.': 'errorImageDownload',
        'Failed to extract audio': 'errorAudioExtract',
        'Failed to extract audio. Please try again or download the video and convert it manually.': 'errorAudioExtract',
        'Thumbnail not available': 'errorThumbnailUnavailable',
        'Too many requests. Please try again later.': 'errorTooManyRequests'
    };

    if (normalized.startsWith('Server error')) {
        return getTranslation('errorServer', normalized);
    }

    const mappedKey = keyMap[normalized];
    if (mappedKey) {
        return getTranslation(mappedKey, normalized);
    }

    return normalized;
}

function setRequestState(state, customDescription = '') {
    if (!requestStatus || !requestStatusTitle || !requestStatusText) return;

    currentRequestState = state;
    currentRequestDescription = customDescription;

    requestStatus.classList.remove('is-idle', 'is-loading', 'is-ready', 'is-error');
    requestStatus.classList.add(`is-${state}`);

    const stateMap = {
        idle: { titleKey: 'statusIdleTitle', descKey: 'statusIdleDesc' },
        loading: { titleKey: 'statusLoadingTitle', descKey: 'statusLoadingDesc' },
        ready: { titleKey: 'statusReadyTitle', descKey: 'statusReadyDesc' },
        downloading: { titleKey: 'statusDownloadingTitle', descKey: 'statusDownloadingDesc' },
        error: { titleKey: 'statusErrorTitle', descKey: 'statusErrorDesc' }
    };

    const stateConfig = stateMap[state] || stateMap.idle;
    requestStatusTitle.textContent = getTranslation(stateConfig.titleKey, requestStatusTitle.textContent);
    requestStatusText.textContent = customDescription || getTranslation(stateConfig.descKey, requestStatusText.textContent);
}

function revealDownloadFeedback(target = resultSection, highlightResult = false) {
    if (!target || typeof target.scrollIntoView !== 'function') return;

    window.requestAnimationFrame(() => {
        target.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
        });
    });

    if (highlightResult && resultSection) {
        resultSection.classList.remove('is-highlighted');
        window.requestAnimationFrame(() => {
            resultSection.classList.add('is-highlighted');
        });

        if (resultHighlightTimer) {
            clearTimeout(resultHighlightTimer);
        }

        resultHighlightTimer = window.setTimeout(() => {
            resultSection.classList.remove('is-highlighted');
        }, 1800);
    }
}

function setAssetButtonsBusy(isBusy, activeButton = null) {
    [downloadSD, downloadHD, downloadMP3Btn, downloadImageBtn].forEach((button) => {
        if (!button) return;
        button.disabled = isBusy;
        button.classList.toggle('loading', isBusy && button === activeButton);
    });
}

function buildProxyDownloadUrl(videoUrl, filename = '') {
    const params = new URLSearchParams({
        url: videoUrl
    });

    if (filename) {
        params.set('filename', filename);
    }

    return `/api/proxy?${params.toString()}`;
}

function triggerServerDownload(downloadUrl, filename = '') {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.src = downloadUrl;

    document.body.appendChild(iframe);

    window.setTimeout(() => {
        if (iframe.parentNode) {
            iframe.parentNode.removeChild(iframe);
        }
    }, 60000);

    // Keep a same-origin anchor as a backup in case the browser ignores iframe download handling.
    const link = document.createElement('a');
    link.href = downloadUrl;
    if (filename) {
        link.download = filename;
    }
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

async function handleDownload() {
    const url = videoUrlInput.value.trim();

    if (!url) {
        showError(getTranslation('errorEmptyUrl', 'Please enter a TikTok URL'));
        return;
    }

    if (!url.includes('tiktok.com') && !url.includes('vm.tiktok.com')) {
        showError(getTranslation('errorInvalidUrl', 'Invalid URL. Please enter a valid TikTok link'));
        return;
    }
    
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
    resultSection.classList.remove('is-highlighted');
    showProgress(false);
    updateProgress(0, '', 0, 0);
    
    // Hiển thị loading
    setRequestState('loading');
    setLoading(true);
    trackEvent('tool_submit', {
        tool: 'homepage_downloader',
        page_type: 'homepage',
        site_language: getActiveLanguage(),
    });
    
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
            if (!data.title) {
                currentVideoData.title = getTranslation('defaultVideoTitle', 'TikTok Video');
            }

            if (!data.author) {
                currentVideoData.author = getTranslation('defaultAuthor', 'Unknown');
            }

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
            setRequestState('ready');
            revealDownloadFeedback(resultSection, true);
            trackEvent('tool_success', {
                tool: 'homepage_downloader',
                page_type: 'homepage',
                site_language: getActiveLanguage(),
                has_hd: Boolean(currentVideoData.video_url_hd),
                has_audio: Boolean(currentVideoData.audio_url),
                has_thumbnail: Boolean(currentVideoData.thumbnail),
            });
        } else {
            trackEvent('tool_error', {
                tool: 'homepage_downloader',
                page_type: 'homepage',
                site_language: getActiveLanguage(),
                error_message: data.error || 'download_failed',
            });
            showError(localizeApiError(data.error, 'errorUnableDownloadVideo'));
        }
    } catch (error) {
        console.error('Error:', error);
        trackEvent('tool_error', {
            tool: 'homepage_downloader',
            page_type: 'homepage',
            site_language: getActiveLanguage(),
            error_message: error.message || 'unexpected_error',
        });
        showError(getTranslation('errorGenericTryAgain', 'An error occurred. Please try again later.'));
    } finally {
        setLoading(false);
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
        if (primaryActionText) {
            primaryActionText.textContent = getTranslation('openDownloader', primaryActionText.textContent);
        }
    }
}

function showError(message, options = {}) {
    const { preserveResult = false } = options;
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    if (!preserveResult) {
        resultSection.style.display = 'none';
    }
    showProgress(false);
    setRequestState('error', message);
    revealDownloadFeedback(errorMessage);
}

// Hàm tải video bằng blob để đảm bảo download
async function downloadVideoAsBlob(videoUrl, filename, triggerButton = null) {
    const assetType = triggerButton === downloadHD ? 'video_hd' : 'video_sd';

    try {
        setAssetButtonsBusy(true, triggerButton);
        setRequestState('downloading');
        showProgress(true);
        updateProgress(0, getTranslation('progressConnecting', 'Connecting...'), 0, 0);
        revealDownloadFeedback(progressContainer);
        
        downloadStartTime = Date.now();
        lastLoaded = 0;
        lastTime = downloadStartTime;
        
        // Tải video qua proxy
        const proxyUrl = buildProxyDownloadUrl(videoUrl, filename);
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
            // Fallback: ask the browser to download from our same-origin proxy route.
            updateProgress(0, getTranslation('progressBrowserDownload', 'Starting browser download...'), 0, 0);
            
            // Tạo link download trực tiếp
            triggerServerDownload(proxyUrl, filename.endsWith('.mp4') ? filename : `${filename}.mp4`);
            trackEvent('asset_download_success', {
                tool: 'homepage_downloader',
                asset_type: assetType,
                delivery: 'browser_proxy',
                site_language: getActiveLanguage(),
            });
            
            setTimeout(() => {
                showProgress(false);
                setAssetButtonsBusy(false);
                setRequestState('ready');
                updateProgress(0, '', 0, 0);
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
        
        updateProgress(0, getTranslation('progressDownloadingVideo', 'Downloading video...'), 0, 0);
        
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
            const statusText = getTranslation('progressDownloadingVideo', 'Downloading video...');
            updateProgress(percent, statusText, loaded, speed);
            
            lastLoaded = loaded;
            lastTime = now;
        }
        
        // Ensure 100% is displayed when complete
        updateProgress(100, getTranslation('progressCompleted', 'Completed!'), loaded, 0);
        
        // Create blob from chunks
        const blob = new Blob(chunks, { type: 'video/mp4' });
        
        updateProgress(100, getTranslation('progressSavingFile', 'Saving file...'), loaded, 0);
        
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
            setAssetButtonsBusy(false);
            setRequestState('ready');
            updateProgress(0, '', 0, 0);
        }, 100);
        trackEvent('asset_download_success', {
            tool: 'homepage_downloader',
            asset_type: assetType,
            delivery: 'blob',
            site_language: getActiveLanguage(),
        });
        
    } catch (error) {
        console.error('Download error:', error);
        showProgress(false);
        
        // Better error messages
        let errorMsg = getTranslation('errorVideoDownload', 'Error downloading video');
        if (error.message.includes('network') || error.message.includes('Network')) {
            errorMsg = getTranslation('errorNetwork', 'Network connection error. Please check your connection and try again.');
        } else if (error.message.includes('server')) {
            errorMsg = getTranslation('errorServer', 'Server error. Please try again later.');
        } else if (error.message) {
            errorMsg = 'Error: ' + error.message;
        }
        
        trackEvent('asset_download_error', {
            tool: 'homepage_downloader',
            asset_type: assetType,
            site_language: getActiveLanguage(),
            error_message: error.message || 'video_download_failed',
        });
        showError(errorMsg, { preserveResult: true });
        setAssetButtonsBusy(false);
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
        progressText.textContent = text || getTranslation('progressDefault', 'Downloading video...');
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
            this.placeholder = getTranslation('inputPlaceholder', 'Paste TikTok video URL here...');
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

async function downloadImage(imageUrl, triggerButton = null) {
    try {
        setAssetButtonsBusy(true, triggerButton);
        setRequestState('downloading');
        showProgress(true);
        updateProgress(0, getTranslation('progressDownloadingImage', 'Downloading image...'), 0, 0);
        revealDownloadFeedback(progressContainer);
        
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
        
        updateProgress(50, getTranslation('progressProcessingImage', 'Processing image...'), 0, 0);
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        
        // Get filename from video data
        const filename = currentVideoData.video_id 
            ? `tiktok_${currentVideoData.video_id}_thumbnail.jpg`
            : 'tiktok_thumbnail.jpg';
        
        updateProgress(90, getTranslation('progressSavingImage', 'Saving image...'), 0, 0);
        
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
            setAssetButtonsBusy(false);
            setRequestState('ready');
            updateProgress(0, '', 0, 0);
        }, 100);
        trackEvent('asset_download_success', {
            tool: 'homepage_downloader',
            asset_type: 'cover_image',
            delivery: 'blob',
            site_language: getActiveLanguage(),
        });
        
    } catch (error) {
        console.error('Error downloading image:', error);
        const errorMsgs = {
            en: 'Failed to download image. Please try again.',
            hi: 'छवि डाउनलोड करने में विफल। कृपया पुनः प्रयास करें।',
            vi: 'Không thể tải ảnh. Vui lòng thử lại.',
            id: 'Gagal mengunduh gambar. Silakan coba lagi.'
        };
        trackEvent('asset_download_error', {
            tool: 'homepage_downloader',
            asset_type: 'cover_image',
            site_language: getActiveLanguage(),
            error_message: error.message || 'image_download_failed',
        });
        showError(errorMsgs[currentLang] || errorMsgs.en, { preserveResult: true });
        showProgress(false);
        setAssetButtonsBusy(false);
    }
}

// ============================================
// DOWNLOAD MP3 (Extract Audio from Video)
// ============================================

async function downloadAudioFromVideo(videoUrl, triggerButton = null) {
    try {
        setAssetButtonsBusy(true, triggerButton);
        setRequestState('downloading');
        showProgress(true);
        updateProgress(0, getTranslation('progressPreparingAudio', 'Preparing audio download...'), 0, 0);
        revealDownloadFeedback(progressContainer);
        
        // Kiểm tra xem có audio URL từ video data không
        let audioUrl = currentVideoData.audio_url;
        
        if (!audioUrl) {
            // Nếu không có, thử gọi API extract audio
            updateProgress(10, getTranslation('progressRequestingAudio', 'Requesting audio extraction...'), 0, 0);
            
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
            updateProgress(30, getTranslation('progressDownloadingAudio', 'Downloading audio...'), 0, 0);
            
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
            
            updateProgress(90, getTranslation('progressSavingAudio', 'Saving audio file...'), 0, 0);
            
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
                setAssetButtonsBusy(false);
                setRequestState('ready');
                updateProgress(0, '', 0, 0);
            }, 100);
            trackEvent('asset_download_success', {
                tool: 'homepage_downloader',
                asset_type: 'audio_mp3',
                delivery: 'blob',
                site_language: getActiveLanguage(),
            });
            
        } else {
            // Không có audio URL, hiển thị thông báo
            const errorMsgs = {
                en: 'Audio URL not available for this video. You can download the video and convert it to MP3 using online converters (e.g., online-audio-converter.com, convertio.co) or apps like Audacity.',
                hi: 'इस वीडियो के लिए ऑडियो URL उपलब्ध नहीं है। आप वीडियो डाउनलोड कर सकते हैं और इसे ऑनलाइन कन्वर्टर (जैसे online-audio-converter.com, convertio.co) या Audacity जैसे ऐप्स का उपयोग करके MP3 में कन्वर्ट कर सकते हैं।',
                vi: 'URL audio không khả dụng cho video này. Bạn có thể tải video và chuyển đổi sang MP3 bằng các công cụ online (ví dụ: online-audio-converter.com, convertio.co) hoặc ứng dụng như Audacity.',
                id: 'URL audio tidak tersedia untuk video ini. Anda dapat mengunduh video dan mengonversinya ke MP3 menggunakan konverter online (mis. online-audio-converter.com, convertio.co) atau aplikasi seperti Audacity.'
            };
            
            trackEvent('asset_download_error', {
                tool: 'homepage_downloader',
                asset_type: 'audio_mp3',
                site_language: getActiveLanguage(),
                error_message: 'audio_url_unavailable',
            });
            showError(errorMsgs[currentLang] || errorMsgs.en, { preserveResult: true });
            showProgress(false);
            setAssetButtonsBusy(false);
        }
        
    } catch (error) {
        console.error('Error extracting audio:', error);
        const errorMsgs = {
            en: 'Failed to extract audio. Please try again or download the video and convert it manually.',
            hi: 'ऑडियो निकालने में विफल। कृपया पुनः प्रयास करें या वीडियो डाउनलोड करके मैन्युअल रूप से कन्वर्ट करें।',
            vi: 'Không thể trích xuất âm thanh. Vui lòng thử lại hoặc tải video và chuyển đổi thủ công.',
            id: 'Gagal mengekstrak audio. Silakan coba lagi atau unduh video dan konversi secara manual.'
        };
        trackEvent('asset_download_error', {
            tool: 'homepage_downloader',
            asset_type: 'audio_mp3',
            site_language: getActiveLanguage(),
            error_message: error.message || 'audio_extract_failed',
        });
        showError(errorMsgs[currentLang] || errorMsgs.en, { preserveResult: true });
        showProgress(false);
        setAssetButtonsBusy(false);
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
    ensureAnalytics();
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

Object.keys(homepageTranslations).forEach((lang) => {
    Object.assign(translations[lang], homepageTranslations[lang]);
});

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
            const translatedText = translations[lang][key];
            const textTarget = el.querySelector('[data-i18n-text]');

            if (textTarget) {
                textTarget.textContent = translatedText;
            } else if (el.tagName === 'BUTTON') {
                const span = el.querySelector('span');
                if (span) {
                    span.textContent = translatedText;
                } else {
                    el.textContent = translatedText;
                }
            } else if (el.children.length === 1 && ['P', 'SPAN', 'STRONG', 'SMALL'].includes(el.firstElementChild.tagName)) {
                el.firstElementChild.textContent = translatedText;
            } else {
                el.textContent = translatedText;
            }
        }
    });
    
    // Update placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (translations[lang] && translations[lang][key]) {
            el.placeholder = translations[lang][key];
        }
    });

    document.querySelectorAll('[data-i18n-title]').forEach(el => {
        const key = el.getAttribute('data-i18n-title');
        if (translations[lang] && translations[lang][key]) {
            el.setAttribute('title', translations[lang][key]);
        }
    });

    document.querySelectorAll('[data-i18n-alt]').forEach(el => {
        const key = el.getAttribute('data-i18n-alt');
        if (translations[lang] && translations[lang][key]) {
            el.setAttribute('alt', translations[lang][key]);
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

    const langButton = document.getElementById('langBtn');
    if (langButton) {
        langButton.setAttribute('aria-label', getTranslation('changeLanguage', 'Change language'));
    }

    if (translations[lang] && translations[lang].pageTitle) {
        document.title = translations[lang].pageTitle;
    }

    if (translations[lang] && translations[lang].pageDescription) {
        const metaSelectors = [
            'meta[name="description"]',
            'meta[name="title"]',
            'meta[property="og:title"]',
            'meta[property="og:description"]',
            'meta[property="twitter:title"]',
            'meta[property="twitter:description"]'
        ];

        metaSelectors.forEach((selector) => {
            const meta = document.querySelector(selector);
            if (!meta) {
                return;
            }

            if (selector.includes('title')) {
                meta.setAttribute('content', translations[lang].pageTitle);
            } else {
                meta.setAttribute('content', translations[lang].pageDescription);
            }
        });
    }

    if (!downloadBtn || !downloadBtn.classList.contains('loading')) {
        setLoading(false);
    }

    setRequestState(
        currentRequestState,
        currentRequestState === 'error' ? currentRequestDescription : ''
    );

    trackEvent('language_change', {
        page_path: window.location.pathname,
        site_language: lang,
        page_type: 'homepage',
    });
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

