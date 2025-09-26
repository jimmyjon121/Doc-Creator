const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Log the current directory
console.log('Server directory:', __dirname);

// Check if AppsCode.html exists
const htmlPath = path.join(__dirname, 'AppsCode.html');
if (fs.existsSync(htmlPath)) {
    console.log('AppsCode.html found at:', htmlPath);
    console.log('File size:', fs.statSync(htmlPath).size, 'bytes');
} else {
    console.error('AppsCode.html NOT FOUND at:', htmlPath);
}

// Serve static files from the current directory
app.use(express.static(__dirname));

// Serve the main HTML file - using readFile instead of sendFile
app.get('/', (req, res) => {
    const filePath = path.join(__dirname, 'AppsCode.html');
    console.log('Request received for root path');
    
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            res.status(500).send('Error loading the application: ' + err.message);
        } else {
            console.log('Successfully read file, sending response...');
            res.setHeader('Content-Type', 'text/html');
            res.send(data);
        }
    });
});

// Alternative route to test
app.get('/test', (req, res) => {
    res.send('<h1>Server is working!</h1><a href="/">Go to AppsCode</a>');
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Serving files from:', __dirname);
    console.log('Test the server at: http://localhost:3000/test');
});