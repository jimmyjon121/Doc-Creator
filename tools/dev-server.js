const http = require('http');
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || 8085;
const PUBLIC_DIR = path.resolve(__dirname, '..', 'dist');
const LOG_FILE = path.resolve(__dirname, '..', 'dist', 'dev-server.log');

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
      const indexFile = path.join(filePath, '_START_DEV_SERVER_HERE.html');
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
  const relativePath = safeSuffix === '/' ? '/_START_DEV_SERVER_HERE.html' : safeSuffix;
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

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
    log(`200 ${relativePath}`);
  });
});

server.listen(PORT, () => {
  log(`Dev server running at http://localhost:${PORT}`);
});
