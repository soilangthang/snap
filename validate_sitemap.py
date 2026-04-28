#!/usr/bin/env python
"""Simple sitemap.xml validator"""
import xml.etree.ElementTree as ET

try:
    tree = ET.parse('sitemap.xml')
    root = tree.getroot()
    
    # Namespace
    ns = {'sm': 'http://www.sitemaps.org/schemas/sitemap/0.9'}
    
    urls = root.findall('.//sm:url', ns)
    print("Sitemap.xml is valid!")
    print(f"Total URLs: {len(urls)}")
    print("\nURLs in sitemap:")
    
    for i, url in enumerate(urls, 1):
        loc = url.find('sm:loc', ns).text if url.find('sm:loc', ns) is not None else 'N/A'
        lastmod = url.find('sm:lastmod', ns).text if url.find('sm:lastmod', ns) is not None else 'N/A'
        priority = url.find('sm:priority', ns).text if url.find('sm:priority', ns) is not None else 'N/A'
        changefreq = url.find('sm:changefreq', ns).text if url.find('sm:changefreq', ns) is not None else 'N/A'
        
        print(f"\n{i}. {loc}")
        print(f"   - Last Modified: {lastmod}")
        print(f"   - Priority: {priority}")
        print(f"   - Change Frequency: {changefreq}")
    
    # Check if blog route exists
    blog_exists = any('blog' in url.find('sm:loc', ns).text for url in urls)
    if blog_exists:
        print("\n[SUCCESS] Blog route (/blog) is included")
    else:
        print("\n[WARNING] Blog route (/blog) is missing")
    
    print("\n[SUCCESS] Validation complete!")
    
except ET.ParseError as e:
    print(f"[ERROR] XML Parse Error: {e}")
except Exception as e:
    print(f"[ERROR] Error: {e}")

