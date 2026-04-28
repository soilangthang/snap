import unittest
from unittest.mock import patch

from app import app


class AppRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = app.test_client()

    def tearDown(self):
        self.client = None

    def test_trailing_slash_content_routes_render_without_redirect(self):
        for path in (
            '/blog/',
            '/how-to-download-tiktok-videos/',
            '/save-tiktok-audio-mp3/',
            '/creator-rights/',
            '/editorial-policy/',
            '/tiktok-cover-downloader/',
            '/tiktok-link-resolver/',
            '/tiktok-video-metadata/',
            '/about/',
            '/privacy/',
            '/terms/',
        ):
            response = self.client.get(path, follow_redirects=False)
            self.assertEqual(response.status_code, 200, path)
            self.assertNotIn('Location', response.headers)
            response.close()

    def test_www_host_redirects_to_apex_domain(self):
        response = self.client.get('/privacy', base_url='https://www.tik1s.com', follow_redirects=False)
        self.assertEqual(response.status_code, 308)
        self.assertEqual(response.headers['Location'], 'https://tik1s.com/privacy')
        response.close()

    def test_www_host_redirect_preserves_query_string(self):
        response = self.client.get(
            '/blog?utm_source=search-console',
            base_url='https://www.tik1s.com',
            follow_redirects=False,
        )
        self.assertEqual(response.status_code, 308)
        self.assertEqual(response.headers['Location'], 'https://tik1s.com/blog?utm_source=search-console')
        response.close()

    def test_gamefun_returns_gone(self):
        response = self.client.get('/gamefun', follow_redirects=False)
        self.assertEqual(response.status_code, 410)
        self.assertEqual(response.headers['X-Robots-Tag'], 'noindex, nofollow')
        self.assertIn(b'410', response.data)
        response.close()

    def test_gamefun_www_host_returns_gone_without_redirect(self):
        response = self.client.get('/gamefun', base_url='https://www.tik1s.com', follow_redirects=False)
        self.assertEqual(response.status_code, 410)
        self.assertEqual(response.headers['X-Robots-Tag'], 'noindex, nofollow')
        self.assertNotIn('Location', response.headers)
        response.close()

    def test_blog_page_loads(self):
        response = self.client.get('/blog')
        self.assertEqual(response.status_code, 200)
        self.assertIn(b'Resource Center', response.data)
        response.close()

    def test_resource_pages_load(self):
        for path in (
            '/how-to-download-tiktok-videos',
            '/save-tiktok-audio-mp3',
            '/creator-rights',
            '/editorial-policy',
            '/tiktok-cover-downloader',
            '/tiktok-link-resolver',
            '/tiktok-video-metadata',
            '/about',
            '/privacy',
            '/terms',
        ):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200, path)
            response.close()

    def test_not_found_page_loads(self):
        response = self.client.get('/this-page-does-not-exist')
        self.assertEqual(response.status_code, 404)
        self.assertIn(b'404', response.data)
        response.close()

    def test_analytics_loader_route_loads(self):
        response = self.client.get('/analytics.js')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.mimetype, 'application/javascript')
        self.assertIn(b'window.Tik1sAnalytics', response.data)
        response.close()

    def test_legacy_blog_i18n_route_is_not_public(self):
        response = self.client.get('/blog-i18n.js')
        self.assertEqual(response.status_code, 404)
        response.close()

    def test_download_rejects_non_tiktok_url(self):
        response = self.client.post('/api/download', json={'url': 'https://example.com/video'})
        self.assertEqual(response.status_code, 400)
        payload = response.get_json()
        self.assertFalse(payload['success'])
        response.close()

    def test_proxy_rejects_private_ip_targets(self):
        response = self.client.get('/api/proxy', query_string={'url': 'http://127.0.0.1/video.mp4'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error'], 'URL is not allowed')
        response.close()

    def test_proxy_image_rejects_unapproved_host(self):
        response = self.client.get('/api/proxy-image', query_string={'url': 'https://example.com/image.jpg'})
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error'], 'URL is not allowed')
        response.close()

    @patch('app.requests.get')
    def test_proxy_blocks_disallowed_redirect(self, mock_get):
        mock_response = mock_get.return_value
        mock_response.url = 'https://example.com/file.mp4'
        mock_response.status_code = 200

        response = self.client.get(
            '/api/proxy',
            query_string={'url': 'https://v16.tiktokcdn.com/file.mp4'}
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.get_json()['error'], 'Upstream redirect is not allowed')
        response.close()

    @patch('app.requests.get')
    def test_proxy_uses_attachment_filename(self, mock_get):
        mock_response = mock_get.return_value
        mock_response.url = 'https://v16.tiktokcdn.com/file.mp4'
        mock_response.status_code = 200
        mock_response.iter_content.return_value = [b'test-video']

        response = self.client.get(
            '/api/proxy',
            query_string={
                'url': 'https://v16.tiktokcdn.com/file.mp4',
                'filename': 'Clip Demo 01'
            }
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.headers['Content-Type'], 'video/mp4')
        self.assertIn('attachment; filename="Clip_Demo_01.mp4"', response.headers['Content-Disposition'])
        self.assertEqual(response.data, b'test-video')
        response.close()

    @patch('app.requests.get')
    def test_proxy_allows_tiktok_us_cdn_hosts(self, mock_get):
        mock_response = mock_get.return_value
        mock_response.url = 'https://v16m.tiktokcdn-us.com/file.mp4'
        mock_response.status_code = 200
        mock_response.iter_content.return_value = [b'test-video']

        response = self.client.get(
            '/api/proxy',
            query_string={'url': 'https://v16m.tiktokcdn-us.com/file.mp4'}
        )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, b'test-video')
        response.close()


if __name__ == '__main__':
    unittest.main()
