from flask import Flask, request, jsonify, send_file, send_from_directory, render_template_string
from flask_cors import CORS
import requests
import re
import os
import tempfile
from urllib.parse import urlparse, parse_qs
from functools import wraps
import time

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

# Visitor counter (in-memory storage, reset on server restart)
# In production, you might want to use a database or file storage
visitor_count = 0
visitor_file = 'visitor_count.txt'

# Load visitor count from file if exists
try:
    if os.path.exists(visitor_file):
        with open(visitor_file, 'r') as f:
            visitor_count = int(f.read().strip() or 0)
except:
    visitor_count = 0

def save_visitor_count():
    """Save visitor count to file"""
    try:
        with open(visitor_file, 'w') as f:
            f.write(str(visitor_count))
    except:
        pass

# Privacy Policy HTML Template
PRIVACY_POLICY_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Privacy Policy - TikTok Downloader</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container" style="max-width: 900px; padding: 40px 20px;">
        <h1>Privacy Policy</h1>
        <p><strong>Last updated:</strong> {{ date }}</p>
        
        <h2>1. Information Collection</h2>
        <p>We do not collect any personal information from users. Our service operates completely anonymously.</p>
        
        <h2>2. Information Usage</h2>
        <p>We only use the provided TikTok URL to download videos. No information is stored or shared.</p>
        
        <h2>3. Security</h2>
        <p>Our service uses secure connections and does not store user data.</p>
        
        <h2>4. Cookies</h2>
        <p>We do not use cookies to track users.</p>
        
        <h2>5. Contact</h2>
        <p>If you have any questions about our privacy policy, please contact us.</p>
        
        <p><a href="/">← Back to homepage</a></p>
    </div>
</body>
</html>
""".replace('{{ date }}', '2024-01-01')

# Terms of Service HTML Template
TERMS_OF_SERVICE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Terms of Service - TikTok Downloader</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container" style="max-width: 900px; padding: 40px 20px;">
        <h1>Terms of Service</h1>
        <p><strong>Last updated:</strong> {{ date }}</p>
        
        <h2>1. Acceptance of Terms</h2>
        <p>By using this service, you agree to these terms of service.</p>
        
        <h2>2. Service Usage</h2>
        <p>The service is provided free of charge to download TikTok videos for personal use. You may not use the service for commercial purposes or to violate copyright.</p>
        
        <h2>3. Copyright</h2>
        <p>Users are responsible for the use of downloaded videos. We are not responsible for copyright violations.</p>
        
        <h2>4. Limitation of Liability</h2>
        <p>The service is provided "as is". We do not guarantee continuous availability of the service.</p>
        
        <h2>5. Changes to Terms</h2>
        <p>We reserve the right to change these terms at any time.</p>
        
        <p><a href="/">← Back to homepage</a></p>
    </div>
</body>
</html>
""".replace('{{ date }}', '2024-01-01')

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
        print(f"Error: {str(e)}")
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
            except:
                continue
        
        # Phương pháp 2: Trực tiếp từ TikTok
        return get_tiktok_direct(url)
        
    except Exception as e:
        print(f"Alternative method error: {str(e)}")
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
    except:
        return {'success': False, 'error': 'Unable to download video'}

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/blog')
@app.route('/blog/')
def blog():
    try:
        # Đảm bảo file tồn tại và có thể đọc được
        if not os.path.exists('blog.html'):
            return jsonify({'error': 'Blog file not found on server'}), 404
        return send_file('blog.html', mimetype='text/html')
    except Exception as e:
        app.logger.error(f"Blog route error: {str(e)}")
        return jsonify({'error': f'Error loading blog: {str(e)}'}), 500

@app.route('/style.css')
def style_css():
    return send_file('style.css', mimetype='text/css')

@app.route('/script.js')
def script_js():
    return send_file('script.js', mimetype='application/javascript')

@app.route('/blog-i18n.js')
def blog_i18n():
    return send_file('blog-i18n.js', mimetype='application/javascript')

@app.route('/favicon.ico')
def favicon_ico():
    response = send_file('favicon.ico', mimetype='image/x-icon')
    # Reduce cache time temporarily to help with updates
    response.headers['Cache-Control'] = 'public, max-age=3600'  # Cache for 1 hour
    response.headers['Expires'] = ''
    return response

@app.route('/privacy')
def privacy():
    return render_template_string(PRIVACY_POLICY_HTML)

@app.route('/terms')
def terms():
    return render_template_string(TERMS_OF_SERVICE_HTML)

@app.route('/robots.txt')
def robots():
    try:
        return send_file('robots.txt', mimetype='text/plain')
    except:
        return 'User-agent: *\nAllow: /', 200, {'Content-Type': 'text/plain'}

@app.route('/sitemap.xml')
def sitemap():
    try:
        return send_file('sitemap.xml', mimetype='application/xml')
    except:
        return '<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>', 200, {'Content-Type': 'application/xml'}

@app.route('/ads.txt')
def ads_txt():
    try:
        return send_file('ads.txt', mimetype='text/plain')
    except:
        return 'google.com, pub-6084835264788220, DIRECT, f08c47fec0942fa0', 200, {'Content-Type': 'text/plain'}

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
        video_url = request.args.get('url')
        if not video_url:
            return jsonify({'error': 'Missing URL'}), 400
        
        # Decode URL nếu bị encode
        from urllib.parse import unquote
        video_url = unquote(video_url)
        
        # Không dùng Range header để tránh lỗi chunked encoding
        response = requests.get(video_url, stream=True, timeout=60, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'identity',  # Disable compression to avoid encoding issues
        })
        
        if response.status_code in [200, 206]:  # 206 for partial content
            from flask import Response, stream_with_context
            import mimetypes
            
            # Lấy tên file từ URL hoặc dùng tên mặc định
            filename = 'tiktok_video.mp4'
            if '?' in video_url:
                url_filename = video_url.split('?')[0].split('/')[-1]
                if url_filename.endswith('.mp4'):
                    filename = url_filename
            
            # Tạo response stream với stream_with_context để tránh lỗi chunked encoding
            @stream_with_context
            def generate():
                try:
                    for chunk in response.iter_content(chunk_size=16384):  # Larger chunk size
                        if chunk:
                            yield chunk
                except Exception as e:
                    print(f"Stream error: {str(e)}")
                    # Don't raise, just stop streaming
                    return
            
            # Headers - không set Transfer-Encoding, Flask sẽ tự động xử lý
            headers = {
                'Content-Disposition': f'attachment; filename="{filename}"',
                'Content-Type': 'video/mp4',
                'Cache-Control': 'no-cache',
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
            
    except Exception as e:
        print(f"Proxy error: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/proxy-image', methods=['GET'])
def proxy_image():
    """Proxy để tải ảnh (thumbnail) tránh CORS"""
    try:
        image_url = request.args.get('url')
        if not image_url:
            return jsonify({'error': 'Missing URL'}), 400
        
        # Decode URL nếu bị encode
        from urllib.parse import unquote
        image_url = unquote(image_url)
        
        response = requests.get(image_url, stream=True, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        })
        
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
            
    except Exception as e:
        print(f"Proxy image error: {str(e)}")
        return jsonify({'error': str(e)}), 500

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
            except:
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
    
    # Kiểm tra các route cụ thể
    path = request.path
    if path == '/blog' or path.startswith('/blog'):
        try:
            return send_file('blog.html')
        except:
            return jsonify({'success': False, 'error': 'Blog page not found'}), 404
    
    # Nếu không phải API, trả về HTML (cho frontend routing)
    try:
        return send_file('index.html'), 404
    except:
        return jsonify({'success': False, 'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Server error. Please try again later.'}), 500

if __name__ == '__main__':
    # Production mode
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

