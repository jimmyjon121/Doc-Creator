const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8083;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'CURRENT-VERSION-v12');
const LOG_FILE = path.resolve(__dirname, '..', 'CURRENT-VERSION-v12', 'stable-server.log');

function log(message) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}`;
  try {
    fs.appendFileSync(LOG_FILE, line + '\n');
  } catch (err) {
    // Log file might not be writable, just use console
  }
  console.log(line);
}

function getFile(filePath, callback) {
  fs.stat(filePath, (err, stats) => {
    if (err) {
      return callback(err);
    }
    if (stats.isDirectory()) {
      const indexFile = path.join(filePath, 'CareConnect-Pro_v12.1-STABLE.html');
      fs.stat(indexFile, (indexErr, indexStats) => {
        if (!indexErr && indexStats.isFile()) {
          return fs.readFile(indexFile, callback);
        }
        return callback({ code: 'DIRECTORY', path: filePath });
      });
    } else {
      fs.readFile(filePath, callback);
    }
  });
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  const safeSuffix = urlPath.replace(/\\/g, '/');
  let relativePath = safeSuffix === '/' ? '/CareConnect-Pro_v12.1-STABLE.html' : safeSuffix;
  
  // If path doesn't end with a known file extension and doesn't end with /, try adding .html
  const hasExtension = /\.(html|js|css|json|png|jpg|gif|svg|ico|woff|woff2|ttf|eot)$/i.test(relativePath);
  if (relativePath !== '/' && !hasExtension && !relativePath.endsWith('/')) {
    relativePath = relativePath + '.html';
  }
  
  const filePath = path.join(PUBLIC_DIR, relativePath);

  getFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
      log(`404 ${relativePath}`);
      return;
    }

    let contentType = 'text/html';
    if (filePath.endsWith('.js')) contentType = 'application/javascript';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.json')) contentType = 'application/json';
    else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';
    else if (filePath.endsWith('.png')) contentType = 'image/png';
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (filePath.endsWith('.gif')) contentType = 'image/gif';
    else if (filePath.endsWith('.ico')) contentType = 'image/x-icon';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    log(`200 ${relativePath}`);
  });
});

server.listen(PORT, () => {
  log(`Stable server running at http://localhost:${PORT}`);
  console.log(`\n✅ Stable version available at: http://localhost:${PORT}`);
  console.log(`   Or directly: http://localhost:${PORT}/CareConnect-Pro_v12.1-STABLE.html\n`);
});

