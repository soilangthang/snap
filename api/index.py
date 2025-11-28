# Vercel serverless function entry point
# This file is for Vercel serverless functions
import sys
import os

# Add parent directory to path
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, parent_dir)

from app import app

# Vercel expects a handler function
def handler(request):
    # Convert Vercel request to WSGI environment
    environ = {
        'REQUEST_METHOD': request.method,
        'PATH_INFO': request.path,
        'QUERY_STRING': request.query_string or '',
        'CONTENT_TYPE': request.headers.get('Content-Type', ''),
        'CONTENT_LENGTH': request.headers.get('Content-Length', '0'),
        'SERVER_NAME': request.headers.get('Host', 'localhost'),
        'SERVER_PORT': '80',
        'wsgi.version': (1, 0),
        'wsgi.url_scheme': 'https',
        'wsgi.input': request.body,
        'wsgi.errors': sys.stderr,
        'wsgi.multithread': False,
        'wsgi.multiprocess': True,
        'wsgi.run_once': False,
    }
    
    # Add headers
    for key, value in request.headers.items():
        key = key.upper().replace('-', '_')
        if key not in ('CONTENT_TYPE', 'CONTENT_LENGTH'):
            key = 'HTTP_' + key
        environ[key] = value
    
    # Create response
    response_data = {'status': 200, 'headers': [], 'body': b''}
    
    def start_response(status, headers):
        response_data['status'] = int(status.split()[0])
        response_data['headers'] = headers
    
    # Call Flask app
    result = app(environ, start_response)
    response_data['body'] = b''.join(result)
    
    return {
        'statusCode': response_data['status'],
        'headers': dict(response_data['headers']),
        'body': response_data['body'].decode('utf-8') if isinstance(response_data['body'], bytes) else response_data['body']
    }
