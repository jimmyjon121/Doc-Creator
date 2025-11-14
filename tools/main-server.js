/**
 * Development server for CareConnect-Pro.html (Main version)
 * Serves on port 8084
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8084;
const ROOT_DIR = path.join(__dirname, '..');
const indexFile = 'CURRENT-VERSION-v12/CareConnect-Pro.html';

// Logging function
function log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    console.log(message);
    try {
        fs.appendFileSync('server.log', logMessage);
    } catch (err) {
        console.error('Failed to write to log file:', err.message);
    }
}

// MIME type mapping
const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0]; // Remove query parameters
    
    // Security: prevent directory traversal
    const safeSuffix = urlPath.replace(/\\/g, '/').replace(/\.\.+/g, '.');
    
    // Default to index file for root
    let relativePath = safeSuffix === '/' ? `/${indexFile}` : safeSuffix;
    
    // For paths without extensions, try adding .html
    if (!path.extname(relativePath) && !relativePath.endsWith('/')) {
        const htmlPath = relativePath + '.html';
        const fullHtmlPath = path.join(ROOT_DIR, htmlPath);
        if (fs.existsSync(fullHtmlPath)) {
            relativePath = htmlPath;
        }
    }
    
    // Construct full path
    const fullPath = path.join(ROOT_DIR, relativePath);
    
    // Ensure the path is within ROOT_DIR
    if (!fullPath.startsWith(ROOT_DIR)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('403 Forbidden');
        log(`403 Forbidden: ${urlPath}`);
        return;
    }
    
    // Check if file exists
    fs.stat(fullPath, (err, stats) => {
        if (err) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404 Not Found');
            log(`404 Not Found: ${urlPath}`);
            return;
        }
        
        if (stats.isDirectory()) {
            // Try to serve index.html from directory
            const indexPath = path.join(fullPath, 'index.html');
            fs.stat(indexPath, (indexErr, indexStats) => {
                if (!indexErr && indexStats.isFile()) {
                    serveFile(indexPath, res);
                } else {
                    res.writeHead(403, { 'Content-Type': 'text/plain' });
                    res.end('403 Forbidden - Directory listing not allowed');
                    log(`403 Forbidden (directory): ${urlPath}`);
                }
            });
        } else {
            serveFile(fullPath, res);
        }
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    let contentType = mimeTypes[ext] || 'application/octet-stream';
    
    // Special handling for specific file types
    if (ext === '.svg') {
        contentType = 'image/svg+xml';
    } else if (ext === '.png') {
        contentType = 'image/png';
    } else if (ext === '.jpg' || ext === '.jpeg') {
        contentType = 'image/jpeg';
    } else if (ext === '.gif') {
        contentType = 'image/gif';
    } else if (ext === '.ico') {
        contentType = 'image/x-icon';
    }
    
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('500 Internal Server Error');
            log(`500 Error reading file: ${filePath} - ${err.message}`);
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-cache',
                'Access-Control-Allow-Origin': '*'
            });
            res.end(data);
            log(`200 OK: ${filePath} (${contentType})`);
        }
    });
}

server.listen(PORT, '127.0.0.1', () => {
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   CareConnect Pro - Main Version Server                       ║
║                                                                ║
║   Server running at: http://localhost:${PORT}                     ║
║                                                                ║
║   Entry point: ${indexFile}     ║
║                                                                ║
║   To access: http://localhost:${PORT}/CareConnect-Pro          ║
║                                                                ║
║   Press Ctrl+C to stop the server                             ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);
    log(`Server started on port ${PORT}`);
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    log('Server shutdown');
    process.exit(0);
});
