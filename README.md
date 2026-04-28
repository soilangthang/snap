# Tik1s

Tik1s is a focused TikTok utility hub built with Flask and static HTML pages.
It currently supports:

- Public TikTok video download
- MP3 extraction
- Cover image download
- Short-link resolution
- Metadata inspection
- Support and policy content for AdSense and SEO trust signals

## Stack

- Backend: Flask
- Frontend: HTML, CSS, vanilla JavaScript
- Deploy target: Vercel

## Active public routes

- `/`
- `/blog`
- `/how-to-download-tiktok-videos`
- `/save-tiktok-audio-mp3`
- `/creator-rights`
- `/editorial-policy`
- `/tiktok-cover-downloader`
- `/tiktok-link-resolver`
- `/tiktok-video-metadata`
- `/about`
- `/privacy`
- `/terms`

## Local development

1. Create and activate a virtual environment.
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Run the app:

```bash
python app.py
```

4. Open:

```text
http://localhost:5000
```

## Tests

Run the regression suite with:

```bash
python -m unittest -q
```

## Analytics

The project now includes a same-origin analytics loader at `/analytics.js`.
It only enables Google Analytics when one of these environment variables is set:

- `GA_MEASUREMENT_ID`
- `GOOGLE_ANALYTICS_ID`
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`

Without one of these values, analytics stays disabled and the frontend no-ops safely.

## AdSense

AdSense loader is included on the homepage.
Auto ads should be managed from the AdSense dashboard, not hard-coded into page layout.

## Current priorities

- Add real traffic and funnel analytics
- Refactor `app.py` into smaller modules
- Break `script.js` into feature-focused files
- Expand API and route test coverage
- Add more high-intent support content and tightly related TikTok tools

## Notes

- Legacy prototype files have been removed from the runtime surface.
- `sitemap.xml`, `robots.txt`, and `ads.txt` are part of the production setup.
- The site is intentionally narrow in scope to stay useful, easier to maintain, and safer for AdSense review.
