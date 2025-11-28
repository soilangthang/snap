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

# Privacy Policy HTML Template
PRIVACY_POLICY_HTML = """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chính Sách Bảo Mật - TikTok Downloader</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container" style="max-width: 900px; padding: 40px 20px;">
        <h1>Chính Sách Bảo Mật</h1>
        <p><strong>Cập nhật lần cuối:</strong> {{ date }}</p>
        
        <h2>1. Thông Tin Thu Thập</h2>
        <p>Chúng tôi không thu thập thông tin cá nhân của người dùng. Dịch vụ của chúng tôi hoạt động hoàn toàn ẩn danh.</p>
        
        <h2>2. Sử Dụng Thông Tin</h2>
        <p>Chúng tôi chỉ sử dụng URL TikTok được cung cấp để tải video. Không có thông tin nào được lưu trữ hoặc chia sẻ.</p>
        
        <h2>3. Bảo Mật</h2>
        <p>Dịch vụ của chúng tôi sử dụng kết nối an toàn và không lưu trữ dữ liệu người dùng.</p>
        
        <h2>4. Cookies</h2>
        <p>Chúng tôi không sử dụng cookies để theo dõi người dùng.</p>
        
        <h2>5. Liên Hệ</h2>
        <p>Nếu bạn có câu hỏi về chính sách bảo mật, vui lòng liên hệ với chúng tôi.</p>
        
        <p><a href="/">← Quay lại trang chủ</a></p>
    </div>
</body>
</html>
""".replace('{{ date }}', '2024-01-01')

# Terms of Service HTML Template
TERMS_OF_SERVICE_HTML = """
<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Điều Khoản Sử Dụng - TikTok Downloader</title>
    <link rel="stylesheet" href="/style.css">
</head>
<body>
    <div class="container" style="max-width: 900px; padding: 40px 20px;">
        <h1>Điều Khoản Sử Dụng</h1>
        <p><strong>Cập nhật lần cuối:</strong> {{ date }}</p>
        
        <h2>1. Chấp Nhận Điều Khoản</h2>
        <p>Bằng việc sử dụng dịch vụ này, bạn đồng ý với các điều khoản sử dụng.</p>
        
        <h2>2. Sử Dụng Dịch Vụ</h2>
        <p>Dịch vụ được cung cấp miễn phí để tải video TikTok cho mục đích cá nhân. Bạn không được sử dụng dịch vụ cho mục đích thương mại hoặc vi phạm bản quyền.</p>
        
        <h2>3. Bản Quyền</h2>
        <p>Người dùng chịu trách nhiệm về việc sử dụng video đã tải. Chúng tôi không chịu trách nhiệm về việc vi phạm bản quyền.</p>
        
        <h2>4. Giới Hạn Trách Nhiệm</h2>
        <p>Dịch vụ được cung cấp "như hiện tại". Chúng tôi không đảm bảo tính khả dụng liên tục của dịch vụ.</p>
        
        <h2>5. Thay Đổi Điều Khoản</h2>
        <p>Chúng tôi có quyền thay đổi điều khoản này bất cứ lúc nào.</p>
        
        <p><a href="/">← Quay lại trang chủ</a></p>
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
                    return jsonify({'success': False, 'error': 'Quá nhiều yêu cầu. Vui lòng thử lại sau.'}), 429
            else:
                calls[ip] = []
            calls[ip].append(now)
            return f(*args, **kwargs)
        return wrapper
    return decorator

def extract_tiktok_id(url):
    """Trích xuất video ID từ URL TikTok"""
    patterns = [
        r'tiktok\.com/@[\w\.-]+/video/(\d+)',
        r'vm\.tiktok\.com/(\w+)',
        r'tiktok\.com/t/(\w+)',
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1) if '(' in pattern else match.group(0)
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
                        return {
                            'success': True,
                            'video_url': url_list[0],
                            'title': video_data.get('desc', 'TikTok Video'),
                            'author': video_data.get('author', {}).get('nickname', 'Unknown'),
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
                            return {
                                'success': True,
                                'video_url': video_url,
                                'title': video_data.get('title', '') or video_data.get('desc', 'TikTok Video'),
                                'author': video_data.get('author', {}).get('nickname', '') if isinstance(video_data.get('author'), dict) else 'Unknown',
                            }
            except:
                continue
        
        # Phương pháp 2: Trực tiếp từ TikTok
        return get_tiktok_direct(url)
        
    except Exception as e:
        print(f"Alternative method error: {str(e)}")
        return {'success': False, 'error': 'Không thể tải video. Vui lòng kiểm tra lại URL.'}

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
        
        return {'success': False, 'error': 'Không thể tải video'}
    except:
        return {'success': False, 'error': 'Không thể tải video'}

@app.route('/')
def index():
    return send_file('index.html')

@app.route('/style.css')
def style_css():
    return send_file('style.css', mimetype='text/css')

@app.route('/script.js')
def script_js():
    return send_file('script.js', mimetype='application/javascript')

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

@app.route('/api/download', methods=['POST'])
@rate_limit(max_per_minute=10)
def download_video():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'success': False, 'error': 'Dữ liệu không hợp lệ'}), 400
            
        url = data.get('url', '').strip()
        
        if not url:
            return jsonify({'success': False, 'error': 'Vui lòng nhập URL'}), 400
        
        # Validate URL format
        if not (url.startswith('http://') or url.startswith('https://')):
            return jsonify({'success': False, 'error': 'URL phải bắt đầu bằng http:// hoặc https://'}), 400
        
        if 'tiktok.com' not in url and 'vm.tiktok.com' not in url:
            return jsonify({'success': False, 'error': 'URL không hợp lệ. Vui lòng nhập link TikTok'}), 400
        
        # Lấy thông tin video
        video_info = get_tiktok_video_info(url)
        
        if not video_info.get('success'):
            return jsonify(video_info), 400
        
        return jsonify(video_info)
        
    except Exception as e:
        app.logger.error(f"Download error: {str(e)}")
        return jsonify({'success': False, 'error': 'Đã xảy ra lỗi. Vui lòng thử lại sau.'}), 500

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
        
        response = requests.get(video_url, stream=True, timeout=30, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Referer': 'https://www.tiktok.com/',
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Range': 'bytes=0-'
        })
        
        if response.status_code in [200, 206]:  # 206 for partial content
            from flask import Response
            import mimetypes
            
            # Tạo response stream để tải xuống
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
            
            # Lấy tên file từ URL hoặc dùng tên mặc định
            filename = 'tiktok_video.mp4'
            if '?' in video_url:
                filename = video_url.split('?')[0].split('/')[-1]
                if not filename.endswith('.mp4'):
                    filename = 'tiktok_video.mp4'
            
            return Response(
                generate(),
                mimetype='video/mp4',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'video/mp4',
                    'Content-Length': response.headers.get('Content-Length', ''),
                }
            )
        else:
            return jsonify({'error': 'Failed to download video'}), 500
            
    except Exception as e:
        print(f"Proxy error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return send_file('index.html'), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'success': False, 'error': 'Lỗi máy chủ. Vui lòng thử lại sau.'}), 500

if __name__ == '__main__':
    # Production mode
    app.run(debug=False, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))

