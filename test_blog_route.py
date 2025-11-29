#!/usr/bin/env python
# Quick test script to check if blog route works

from app import app
import sys

print("Testing blog route...")
print("-" * 50)

with app.test_client() as client:
    # Test /blog route
    response = client.get('/blog')
    print(f"GET /blog - Status: {response.status_code}")
    print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
    print(f"Content Length: {len(response.data)} bytes")
    
    if response.status_code == 200:
        print("[SUCCESS] Blog route is working!")
        if b'<!DOCTYPE html>' in response.data[:100]:
            print("[SUCCESS] Content looks like HTML")
        if b'Blog - TikTok Downloader' in response.data or b'blogTitle' in response.data:
            print("[SUCCESS] Blog content found")
    else:
        print(f"[ERROR] Status {response.status_code}")
        print(f"Response: {response.data[:200]}")
    
    print("-" * 50)
    
    # Test /blog/ with trailing slash
    response2 = client.get('/blog/')
    print(f"GET /blog/ - Status: {response2.status_code}")
    
    if response2.status_code == 200:
        print("[SUCCESS] Blog route with trailing slash works!")
    else:
        print(f"[ERROR] Status {response2.status_code}")

print("\nIf both routes return 200, the issue is likely:")
print("1. Server hasn't been restarted after adding the route")
print("2. Need to restart: Ctrl+C then 'python app.py'")

