from flask import Flask, Response, request, jsonify, send_file, redirect
from flask_cors import CORS
import requests
import re
import os
import ipaddress
import json
from urllib.parse import urlparse, unquote
from functools import wraps
import time

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

ALLOWED_PROXY_HOSTS = (
    'tiktok.com',
    'tiktokcdn.com',
    'tiktokcdn-us.com',
    'tiktokcdn-eu.com',
    'tiktokv.com',
    'bytecdn-tos.com',
    'ibyteimg.com',
    'ibytedtos.com',
    'muscdn.com',
    'musical.ly',
    'akamaized.net',
)

CANONICAL_HOST = 'tik1s.com'
LEGACY_CANONICAL_HOSTS = {'www.tik1s.com'}
LEGACY_GONE_PATHS = {'/gamefun', '/gamefun/'}

# Visitor counter (in-memory storage, reset on server restart)
# In production, you might want to use a database or file storage
visitor_count = 0
visitor_file = 'visitor_count.txt'

# Load visitor count from file if exists
try:
    if os.path.exists(visitor_file):
        with open(visitor_file, 'r') as f:
            visitor_count = int(f.read().strip() or 0)
except (OSError, ValueError) as exc:
    app.logger.warning("Failed to load visitor count: %s", exc)
    visitor_count = 0

def save_visitor_count():
    """Save visitor count to file"""
    try:
        with open(visitor_file, 'w') as f:
            f.write(str(visitor_count))
    except OSError as exc:
        app.logger.warning("Failed to save visitor count: %s", exc)

def log_exception(message, exc):
    app.logger.warning("%s: %s", message, exc)

def get_request_host():
    return (request.host or '').split(':', 1)[0].lower()

def build_canonical_redirect_url():
    target = f'https://{CANONICAL_HOST}{request.path or "/"}'
    query = request.query_string.decode('utf-8', errors='ignore')
    if query:
        target = f'{target}?{query}'
    return target

def serve_gone_page():
    try:
        response = send_file('410.html', mimetype='text/html')
    except OSError as exc:
        log_exception("Failed to render 410 page", exc)
        response = Response('Gone', mimetype='text/plain')

    response.status_code = 410
    response.headers['X-Robots-Tag'] = 'noindex, nofollow'
    response.headers['Cache-Control'] = 'public, max-age=3600'
    return response

@app.before_request
def handle_legacy_paths_and_hosts():
    if request.path in LEGACY_GONE_PATHS:
        return serve_gone_page()

    if get_request_host() in LEGACY_CANONICAL_HOSTS:
        return redirect(build_canonical_redirect_url(), code=308)

def is_private_host(hostname):
    if not hostname:
        return True

    normalized = hostname.strip().lower()
    if normalized in {'localhost', '127.0.0.1', '::1'}:
        return True

    try:
        ip = ipaddress.ip_address(normalized)
    except ValueError:
        return False

    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )

def is_allowed_proxy_url(raw_url):
    try:
        parsed = urlparse(raw_url)
    except ValueError:
        return False

    hostname = (parsed.hostname or '').lower()
    if parsed.scheme not in {'http', 'https'} or not hostname or is_private_host(hostname):
        return False

    return any(hostname == allowed or hostname.endswith(f'.{allowed}') for allowed in ALLOWED_PROXY_HOSTS)

def validate_proxy_target(raw_url):
    decoded_url = unquote((raw_url or '').strip())
    if not decoded_url:
        return None, jsonify({'error': 'Missing URL'}), 400

    if not is_allowed_proxy_url(decoded_url):
        return None, jsonify({'error': 'URL is not allowed'}), 400

    return decoded_url, None, None

def sanitize_download_filename(raw_filename, default_filename='tiktok_video.mp4'):
    if not raw_filename:
        return default_filename

    candidate = unquote(raw_filename).strip().replace('\x00', '')
    candidate = os.path.basename(candidate)
    candidate = re.sub(r'[^A-Za-z0-9._-]+', '_', candidate).strip('._')

    if not candidate:
        return default_filename

    if not candidate.lower().endswith('.mp4'):
        candidate = f'{candidate}.mp4'

    return candidate


def get_analytics_measurement_id():
    for key in ('GA_MEASUREMENT_ID', 'GOOGLE_ANALYTICS_ID', 'NEXT_PUBLIC_GA_MEASUREMENT_ID'):
        value = os.environ.get(key, '').strip()
        if value:
            return value
    return ''

# Rate limiting decorator
def rate_limit(max_per_minute=10):
    calls = {}
    def decorator(f):
        @wraps(f)
        def wrapper(*args, **kwargs):
            ip = request.remote_addr
            now = time.time()
            if ip in calls:
                calls[ip] = [t for t in calls[ip] if now - t < 60]
                if len(calls[ip]) >= max_per_minute:
                    return jsonify({'success': False, 'error': 'Too many requests. Please try again later.'}), 429
            else:
                calls[ip] = []
            calls[ip].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

def extract_tiktok_id(url):
    """Trích xuất video ID từ URL TikTok"""
    patterns = [
        r'tiktok\.com/@[\w\.-]+/video/(\d+)',  # Standard format: /@username/video/1234567890
        r'vm\.tiktok\.com/(\w+)',  # Short link format
        r'tiktok\.com/t/(\w+)',  # Alternative format
        r'tiktok\.com/video/(\d+)',  # Direct video format
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            # Return the captured group (video ID)
            return match.group(1)
    return None

def get_tiktok_video_info(url):
    """Lấy thông tin video TikTok"""
    try:
        # Thử phương pháp 1: Sử dụng API công khai
        video_id = extract_tiktok_id(url)
        if video_id:
            api_url = f"https://api16-normal-c-useast1a.tiktokv.com/aweme/v1/feed/?aweme_id={video_id}"
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
                'Accept': 'application/json, text/plain, */*',
                'Referer': 'https://www.tiktok.com/',
            }
            
            response = requests.get(api_url, headers=headers, timeout=15)
            if response.status_code == 200:
                data = response.json()
                if 'aweme_list' in data and len(data['aweme_list']) > 0:
                    video_data = data['aweme_list'][0]
                    video_info = video_data.get('video', {})
                    
                    # Lấy video không watermark
                    play_addr = video_info.get('play_addr', {})
                    url_list = play_addr.get('url_list', [])
                    
                    if url_list:
                        # Extract video ID for consistent filename
                        video_id = video_data.get('aweme_id', '') or extract_tiktok_id(url) or ''
                        
                        # Lấy video HD nếu có
                        bit_rate = video_info.get('bit_rate', [])
                        hd_url = url_list[0]  # Default to first URL
                        if bit_rate and len(bit_rate) > 0:
                            # Tìm video có bitrate cao nhất (HD)
                            play_addr_hd = bit_rate[0].get('play_addr', {})
                            hd_url_list = play_addr_hd.get('url_list', [])
                            if hd_url_list:
                                hd_url = hd_url_list[0]
                        
                        # Lấy thumbnail
                        cover = video_data.get('video', {}).get('cover', {})
                        cover_url_list = cover.get('url_list', []) if cover else []
                        thumbnail = cover_url_list[0] if cover_url_list else ''
                        
                        # Lấy avatar author
                        author_info = video_data.get('author', {})
                        avatar = author_info.get('avatar_thumb', {}).get('url_list', [])
                        author_avatar = avatar[0] if avatar else ''
                        
                        # Lấy audio/music URL nếu có
                        music_info = video_data.get('music', {})
                        audio_url = ''
                        if music_info:
                            play_url = music_info.get('play_url', {})
                            if isinstance(play_url, dict):
                                url_list_audio = play_url.get('url_list', [])
                                if url_list_audio:
                                    audio_url = url_list_audio[0]
                            elif isinstance(play_url, str):
                                audio_url = play_url
                        
                        return {
                            'success': True,
                            'video_url': url_list[0],  # SD/Default
                            'video_url_hd': hd_url,  # HD
                            'title': video_data.get('desc', 'TikTok Video'),
                            'author': author_info.get('nickname', 'Unknown'),
                            'author_avatar': author_avatar,
                            'video_id': video_id,
                            'thumbnail': thumbnail,
                            'audio_url': audio_url,  # Audio URL for MP3 download
                        }
        
        # Fallback: Sử dụng API khác
        return get_tiktok_video_alternative(url)
        
    except Exception as e:
        log_exception("Primary TikTok API failed", e)
        # Thử phương pháp dự phòng
        return get_tiktok_video_alternative(url)

def get_tiktok_video_alternative(url):
    """Phương pháp dự phòng để lấy video"""
    try:
        # Phương pháp 1: Sử dụng dịch vụ API công khai
        api_endpoints = [
            "https://api.tiklydown.eu.org/api/download",
            "https://tikwm.com/api/",
        ]
        
        for endpoint in api_endpoints:
            try:
                if 'tikwm' in endpoint:
                    response = requests.post(endpoint, json={'url': url}, timeout=15, headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Content-Type': 'application/json'
                    })
                else:
                    response = requests.post(endpoint, json={'url': url}, timeout=15)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('status') == 'success' or data.get('code') == 0:
                        video_data = data.get('data', {}) or data.get('video', {})
                        video_url = video_data.get('play', '') or video_data.get('play_addr', {}).get('url_list', [None])[0]
                        
                        if video_url:
                            # Extract video ID for consistent filename
                            video_id = extract_tiktok_id(url) or ''
                            
                            # Lấy HD video nếu có
                            hd_url = video_data.get('hdplay', '') or video_data.get('play', '') or video_url
                            
                            # Lấy thumbnail
                            thumbnail = video_data.get('cover', '') or video_data.get('thumbnail', '') or ''
                            
                            # Lấy author info
                            author_info = video_data.get('author', {})
                            if isinstance(author_info, dict):
                                author_name = author_info.get('nickname', 'Unknown')
                                author_avatar = author_info.get('avatar', '') or ''
                            else:
                                author_name = 'Unknown'
                                author_avatar = ''
                            
                            # Lấy audio/music URL nếu có
                            audio_url = ''
                            music_info = video_data.get('music', {})
                            if music_info:
                                if isinstance(music_info, dict):
                                    audio_url = music_info.get('play_url', '') or music_info.get('playUrl', '') or ''
                                elif isinstance(music_info, str):
                                    audio_url = music_info
                            
                            return {
                                'success': True,
                                'video_url': video_url,  # SD/Default
                                'video_url_hd': hd_url,  # HD
                                'title': video_data.get('title', '') or video_data.get('desc', 'TikTok Video'),
                                'author': author_name,
                                'author_avatar': author_avatar,
                                'video_id': video_id,
                                'thumbnail': thumbnail,
                                'audio_url': audio_url,  # Audio URL for MP3 download
                            }
            except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
                log_exception(f"Alternative API failed for {endpoint}", exc)
                continue
        
        # Phương pháp 2: Trực tiếp từ TikTok
        return get_tiktok_direct(url)
        
    except Exception as e:
        log_exception("Alternative method error", e)
        return {'success': False, 'error': 'Unable to download video. Please check the URL.'}

def get_tiktok_direct(url):
    """Lấy video trực tiếp từ TikTok bằng web scraping"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Referer': 'https://www.tiktok.com/',
        }
        
        response = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
        if response.status_code == 200:
            # Tìm video URL trong HTML
            html_content = response.text
            # Tìm pattern chứa video URL
            import json
            if 'window.__UNIVERSAL_DATA_FOR_REHYDRATION__' in html_content:
                # Extract JSON data
                start = html_content.find('window.__UNIVERSAL_DATA_FOR_REHYDRATION__')
                # This is a simplified approach - in production, you'd want more robust parsing
                pass
        
        return {'success': False, 'error': 'Unable to download video'}
    except requests.RequestException as exc:
        log_exception("Direct TikTok fetch failed", exc)
        return {'success': False, 'error': 'Unable to download video'}
    except Exception as exc:
        log_exception("Unexpected direct TikTok error", exc)
        return {'success': False, 'error': 'Unable to download video'}

@app.route('/')
def index():
    response = send_file('index.html')
    # Ensure canonical URL is set correctly
    response.headers['Link'] = '<https://tik1s.com/>; rel="canonical"'
    return response

def serve_html_page(filename, canonical_url):
    response = send_file(filename, mimetype='text/html')
    response.headers['Link'] = f'<{canonical_url}>; rel="canonical"'
    return response

@app.route('/blog', strict_slashes=False)
def blog():
    try:
        if not os.path.exists('blog.html'):
            return jsonify({'error': 'Blog file not found on server'}), 404
        return serve_html_page('blog.html', 'https://tik1s.com/blog')
    except Exception as e:
        app.logger.error(f"Blog route error: {str(e)}")
        return jsonify({'error': f'Error loading blog: {str(e)}'}), 500

@app.route('/how-to-download-tiktok-videos', strict_slashes=False)
def guide_download_videos():
    return serve_html_page('how-to-download-tiktok-videos.html', 'https://tik1s.com/how-to-download-tiktok-videos')

@app.route('/save-tiktok-audio-mp3', strict_slashes=False)
def guide_save_mp3():
    return serve_html_page('save-tiktok-audio-mp3.html', 'https://tik1s.com/save-tiktok-audio-mp3')

@app.route('/creator-rights', strict_slashes=False)
def creator_rights():
    return serve_html_page('creator-rights.html', 'https://tik1s.com/creator-rights')

@app.route('/editorial-policy', strict_slashes=False)
def editorial_policy():
    return serve_html_page('editorial-policy.html', 'https://tik1s.com/editorial-policy')

@app.route('/tiktok-cover-downloader', strict_slashes=False)
def tiktok_cover_downloader():
    return serve_html_page('tiktok-cover-downloader.html', 'https://tik1s.com/tiktok-cover-downloader')

@app.route('/tiktok-link-resolver', strict_slashes=False)
def tiktok_link_resolver():
    return serve_html_page('tiktok-link-resolver.html', 'https://tik1s.com/tiktok-link-resolver')

@app.route('/tiktok-video-metadata', strict_slashes=False)
def tiktok_video_metadata():
    return serve_html_page('tiktok-video-metadata.html', 'https://tik1s.com/tiktok-video-metadata')

@app.route('/style.css')
def style_css():
    return send_file('style.css', mimetype='text/css')

@app.route('/script.js')
def script_js():
    return send_file('script.js', mimetype='application/javascript')

@app.route('/page-i18n.js')
def page_i18n():
    return send_file('page-i18n.js', mimetype='application/javascript')

@app.route('/analytics.js')
def analytics_js():
    measurement_id = get_analytics_measurement_id()
    config = {
        'enabled': bool(measurement_id),
        'measurementId': measurement_id,
    }

    script = f"""(function () {{
    const config = {json.dumps(config)};
    if (window.Tik1sAnalytics) {{
        return;
    }}

    function sanitizeParams(params) {{
        const result = {{}};
        Object.entries(params || {{}}).forEach(([key, value]) => {{
            if (value === undefined || value === null) {{
                return;
            }}

            if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {{
                result[key] = value;
                return;
            }}

            if (Array.isArray(value)) {{
                result[key] = value.map((item) => String(item)).join(',');
                return;
            }}

            result[key] = String(value);
        }});
        return result;
    }}

    const analytics = {{
        enabled: Boolean(config.enabled && config.measurementId),
        measurementId: config.measurementId || null,
        track(eventName, params) {{
            if (!analytics.enabled || !eventName || typeof window.gtag !== 'function') {{
                return false;
            }}

            window.gtag('event', eventName, sanitizeParams(params));
            return true;
        }},
        trackPageView(params) {{
            return analytics.track('page_view', Object.assign({{
                page_title: document.title,
                page_path: window.location.pathname,
                page_location: window.location.href
            }}, sanitizeParams(params)));
        }}
    }};

    window.Tik1sAnalytics = analytics;

    if (!analytics.enabled) {{
        return;
    }}

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function() {{
        window.dataLayer.push(arguments);
    }};

    window.gtag('js', new Date());
    window.gtag('config', config.measurementId, {{
        send_page_view: false
    }});

    analytics.trackPageView();

    const loader = document.createElement('script');
    loader.async = true;
    loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(config.measurementId);
    loader.crossOrigin = 'anonymous';
    document.head.appendChild(loader);
}})();"""

    return Response(
        script,
        mimetype='application/javascript',
        headers={'Cache-Control': 'public, max-age=300'},
    )

@app.route('/favicon.ico')
def favicon_ico():
    response = send_file('favicon.ico', mimetype='image/x-icon')
    # Reduce cache time temporarily to help with updates
    response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
    response.headers['Expires'] = ''
    return response

@app.route('/privacy', strict_slashes=False)
def privacy():
    return serve_html_page('privacy.html', 'https://tik1s.com/privacy')

@app.route('/terms', strict_slashes=False)
def terms():
    return serve_html_page('terms.html', 'https://tik1s.com/terms')

@app.route('/about', strict_slashes=False)
def about():
    return serve_html_page('about.html', 'https://tik1s.com/about')

@app.route('/robots.txt')
def robots():
    try:
        return send_file('robots.txt', mimetype='text/plain')
    except OSError as exc:
        log_exception("Failed to serve robots.txt", exc)
        return 'User-agent: *\nAllow: /', 200, {'Content-Type': 'text/plain'}

@app.route('/sitemap.xml')
def sitemap():
    try:
        return send_file('sitemap.xml', mimetype='application/xml')
    except OSError as exc:
        log_exception("Failed to serve sitemap.xml", exc)
        return '<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>', 200, {'Content-Type': 'application/xml'}

# Nội dung ads.txt (phục vụ trực tiếp để chắc chắn hoạt động trên Vercel/serverless)
ADS_TXT_CONTENT = """google.com, pub-6084835264788220, DIRECT, f08c47fec0942fa0
"""

@app.route('/ads.txt')
def ads_txt():
    return Response(ADS_TXT_CONTENT.strip(), mimetype='text/plain', headers={
        'Cache-Control': 'public, max-age=3600',
    })

@app.route('/api/download', methods=['POST'])
@rate_limit(max_per_minute=10)
def download_video():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Invalid data'}), 400
            
        url = data.get('url', '').strip()
        platform = data.get('platform', '').strip().lower()
        
        if not url:
            return jsonify({'success': False, 'error': 'Please enter a URL'}), 400
        
        # Validate URL format
        if not (url.startswith('http://') or url.startswith('https://')):
            return jsonify({'success': False, 'error': 'URL must start with http:// or https://'}), 400
        
        # Validate TikTok URL
        if 'tiktok.com' not in url and 'vm.tiktok.com' not in url:
            return jsonify({'success': False, 'error': 'Invalid URL. Please enter a TikTok link'}), 400
        
        # Lấy thông tin video TikTok
        video_info = get_tiktok_video_info(url)
        
        if not video_info.get('success'):
            return jsonify(video_info), 400
        
        return jsonify(video_info)
        
    except Exception as e:
        app.logger.error(f"Download error: {str(e)}")
        return jsonify({'success': False, 'error': 'An error occurred. Please try again later.'}), 500

@app.route('/api/visitor', methods=['GET', 'POST'])
def visitor_counter():
    """API để đếm số lượt truy cập"""
    global visitor_count
    try:
        if request.method == 'POST':
            # Increment counter
            visitor_count += 1
            save_visitor_count()
        # Return current count
        return jsonify({
            'success': True,
            'count': visitor_count
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'count': visitor_count,
            'error': str(e)
        })

@app.route('/api/proxy', methods=['GET'])
def proxy_video():
    """Proxy để tải video trực tiếp"""
    try:
        video_url, error_response, status_code = validate_proxy_target(request.args.get('url'))
        if error_response:
            return error_response, status_code
        
        # Decode URL nếu bị encode
        
        
        # Không dùng Range header để tránh lỗi chunked encoding
        response = requests.get(video_url, stream=True, timeout=60, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'identity',  # Disable compression to avoid encoding issues
        })
        if not is_allowed_proxy_url(response.url):
            app.logger.warning("Blocked proxy redirect to disallowed host: %s", response.url)
            return jsonify({'error': 'Upstream redirect is not allowed'}), 400
        
        if response.status_code in [200, 206]:  # 206 for partial content
            from flask import Response, stream_with_context
            
            # Lấy tên file từ URL hoặc dùng tên mặc định
            filename = sanitize_download_filename(request.args.get('filename'))
            if '?' in video_url:
                url_filename = video_url.split('?')[0].split('/')[-1]
                if url_filename.endswith('.mp4') and not request.args.get('filename'):
                    filename = url_filename
            
            # Tạo response stream với stream_with_context để tránh lỗi chunked encoding
            @stream_with_context
            def generate():
                try:
                    for chunk in response.iter_content(chunk_size=16384):  # Larger chunk size
                        if chunk:
                            yield chunk
                except Exception as e:
                    log_exception("Video stream interrupted", e)
                    # Don't raise, just stop streaming
                    return
            
            # Headers - không set Transfer-Encoding, Flask sẽ tự động xử lý
            headers = {
                'Content-Disposition': f'attachment; filename="{filename}"',
                'Content-Type': 'video/mp4',
                'Cache-Control': 'no-cache',
                'Access-Control-Expose-Headers': 'Content-Disposition, Content-Length',
            }
            
            # Không set Content-Length để tránh mismatch
            # Flask sẽ tự động sử dụng chunked encoding
            
            return Response(
                generate(),
                mimetype='video/mp4',
                headers=headers,
                direct_passthrough=True  # Important for streaming
            )
        else:
            return jsonify({'error': 'Failed to download video'}), 500
            
    except requests.RequestException as exc:
        log_exception("Proxy video request failed", exc)
        return jsonify({'error': 'Failed to download video'}), 502
    except Exception as exc:
        log_exception("Proxy video error", exc)
        return jsonify({'error': 'Internal proxy error'}), 500

@app.route('/api/proxy-image', methods=['GET'])
def proxy_image():
    """Proxy để tải ảnh (thumbnail) tránh CORS"""
    try:
        image_url, error_response, status_code = validate_proxy_target(request.args.get('url'))
        if error_response:
            return error_response, status_code
        
        # Decode URL nếu bị encode
        
        
        response = requests.get(image_url, stream=True, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        })
        if not is_allowed_proxy_url(response.url):
            app.logger.warning("Blocked image proxy redirect to disallowed host: %s", response.url)
            return jsonify({'error': 'Upstream redirect is not allowed'}), 400
        
        if response.status_code == 200:
            from flask import Response
            
            # Xác định content type từ response hoặc URL
            content_type = response.headers.get('Content-Type', 'image/jpeg')
            if '?' in image_url:
                url_ext = image_url.split('?')[0].split('.')[-1].lower()
                if url_ext in ['jpg', 'jpeg']:
                    content_type = 'image/jpeg'
                elif url_ext == 'png':
                    content_type = 'image/png'
                elif url_ext == 'webp':
                    content_type = 'image/webp'
            
            return Response(
                response.iter_content(chunk_size=8192),
                mimetype=content_type,
                headers={
                    'Cache-Control': 'public, max-age=3600',
                    'Access-Control-Allow-Origin': '*',
                }
            )
        else:
            return jsonify({'error': 'Failed to download image'}), 500
            
    except requests.RequestException as exc:
        log_exception("Proxy image request failed", exc)
        return jsonify({'error': 'Failed to download image'}), 502
    except Exception as exc:
        log_exception("Proxy image error", exc)
        return jsonify({'error': 'Internal proxy error'}), 500

@app.route('/api/extract-audio', methods=['POST'])
@rate_limit(max_per_minute=5)
def extract_audio():
    """Extract audio (MP3) từ video TikTok"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Invalid data'}), 400
        
        video_url = data.get('video_url', '').strip()
        video_id = data.get('video_id', '').strip()
        
        if not video_url:
            return jsonify({'success': False, 'error': 'Missing video URL'}), 400
        
        # Sử dụng API công khai để extract audio
        # Thử các API endpoints khác nhau
        api_endpoints = [
            f"https://api.tiklydown.eu.org/api/download?url={video_url}",
            f"https://tikwm.com/api/?url={video_url}",
        ]
        
        for api_url in api_endpoints:
            try:
                response = requests.get(api_url, timeout=15, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                })
                
                if response.status_code == 200:
                    data_resp = response.json()
                    
                    # Tìm audio URL trong response
                    audio_url = None
                    if 'data' in data_resp:
                        audio_url = data_resp['data'].get('music', {}).get('play_url', '') or \
                                   data_resp['data'].get('music', {}).get('playUrl', '') or \
                                   data_resp['data'].get('audio', '')
                    
                    if audio_url:
                        return jsonify({
                            'success': True,
                            'audio_url': audio_url,
                            'video_id': video_id,
                        })
            except (requests.RequestException, ValueError, KeyError, TypeError) as exc:
                log_exception(f"Audio extraction API failed for {api_url}", exc)
                continue
        
        # Fallback: Trả về video URL để client tự xử lý
        # Hoặc sử dụng dịch vụ conversion online
        return jsonify({
            'success': False,
            'error': 'Audio extraction service temporarily unavailable. Please try downloading the video and converting it manually.',
            'video_url': video_url  # Provide video URL as fallback
        }), 503
        
    except Exception as e:
        app.logger.error(f"Extract audio error: {str(e)}")
        return jsonify({'success': False, 'error': 'An error occurred while extracting audio.'}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    # Nếu là API request, trả về JSON error
    if request.path.startswith('/api/'):
        return jsonify({'success': False, 'error': 'API endpoint not found'}), 404
    
    # Trả về trang 404 có noindex (tránh Google lập chỉ mục URL lỗi như trùng lặp)
    try:
        response = send_file('404.html', mimetype='text/html')
        response.status_code = 404
        return response
    except OSError as exc:
        log_exception("Failed to render 404 page", exc)
        return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Server error. Please try again later.'}), 500

if __name__ == '__main__':
    # Production mode
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

