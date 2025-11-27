const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8000;
const BASE_DIR = __dirname;

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url);
    let pathname = parsedUrl.pathname;
    
    // Default to CareConnect-Pro.html if root is requested
    if (pathname === '/') {
        pathname = '/CareConnect-Pro.html';
    }
    
    // Remove leading slash and construct file path
    const filePath = path.join(BASE_DIR, pathname.replace(/^\//, ''));
    
    // Security: prevent directory traversal
    if (!filePath.startsWith(BASE_DIR)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/html' });
            res.end(`<h1>404 - File Not Found</h1><p>${pathname}</p>`);
            return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[ext] || 'application/octet-stream';
        
        fs.readFile(filePath, (error, content) => {
            if (error) {
                res.writeHead(500);
                res.end(`Server error: ${error.code}`);
            } else {
                res.writeHead(200, { 
                    'Content-Type': contentType,
                    'Access-Control-Allow-Origin': '*'
                });
                res.end(content);
            }
        });
    });
});

server.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('   CareConnect Pro - Dev Server');
    console.log('========================================');
    console.log('');
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log(`  Main app: http://localhost:${PORT}/CareConnect-Pro.html`);
    console.log('');
    console.log('  Press Ctrl+C to stop the server');
    console.log('');
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});


