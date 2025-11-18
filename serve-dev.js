const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8087;
const PUBLIC_DIR = path.join(__dirname, 'dist');

// MIME types
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
    '.zip': 'application/zip',
    '.md': 'text/markdown',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = url.parse(req.url);
    let pathname = `.${parsedUrl.pathname}`;
    
    // Default to CareConnect-Interactive.html if root is requested
    if (pathname === './') {
        pathname = './CareConnect-Interactive.html';
    }
    
    // Construct file path
    const filePath = path.join(PUBLIC_DIR, pathname.replace('./', ''));
    
    // Check if file exists
    fs.exists(filePath, (exist) => {
        if (!exist) {
            // File not found
            res.statusCode = 404;
            res.setHeader('Content-Type', 'text/html');
            res.end(`<h1>404 - File Not Found</h1><p>The requested file ${pathname} was not found.</p>`);
            return;
        }
        
        // Check if it's a directory
        fs.stat(filePath, (err, stats) => {
            if (err) {
                res.statusCode = 500;
                res.end(`Error getting file stats: ${err}.`);
                return;
            }
            
            if (stats.isDirectory()) {
                // Look for index.html or CareConnect-Interactive.html in the directory
                const indexPath = path.join(filePath, 'CareConnect-Interactive.html');
                const altIndexPath = path.join(filePath, 'index.html');
                
                if (fs.existsSync(indexPath)) {
                    serveFile(indexPath, res);
                } else if (fs.existsSync(altIndexPath)) {
                    serveFile(altIndexPath, res);
                } else {
                    // List directory contents
                    fs.readdir(filePath, (err, files) => {
                        if (err) {
                            res.statusCode = 500;
                            res.end(`Error reading directory: ${err}.`);
                            return;
                        }
                        
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'text/html');
                        let html = `<h1>Directory listing for ${pathname}</h1><ul>`;
                        files.forEach(file => {
                            const fileUrl = path.posix.join(pathname, file);
                            html += `<li><a href="${fileUrl}">${file}</a></li>`;
                        });
                        html += '</ul>';
                        res.end(html);
                    });
                }
            } else {
                // Serve the file
                serveFile(filePath, res);
            }
        });
    });
});

function serveFile(filePath, res) {
    // Get file extension
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.statusCode = 404;
                res.end('File not found');
            } else {
                res.statusCode = 500;
                res.end(`Server error: ${error.code}`);
            }
        } else {
            res.statusCode = 200;
            res.setHeader('Content-Type', contentType);
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(content);
        }
    });
}

server.listen(PORT, () => {
    console.log('');
    console.log('========================================');
    console.log('   CareConnect Pro - Onboarding Engine');
    console.log('========================================');
    console.log('');
    console.log(`  Server running at: http://localhost:${PORT}`);
    console.log(`  Main app: http://localhost:${PORT}/CareConnect-Interactive.html`);
    console.log('');
    console.log('  Available files:');
    console.log('  - CareConnect-Interactive.html (Onboarding + Learning)');
    console.log('  - CareConnect-Pro.html (Main Application)');
    console.log('  - CareConnect-Clinical-Suite.html (Clinical Suite)');
    console.log('');
    console.log('  Press Ctrl+C to stop the server');
    console.log('');
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});

process.on('SIGINT', () => {
    console.log('\nShutting down server...');
    server.close(() => {
        console.log('Server stopped');
        process.exit(0);
    });
});
