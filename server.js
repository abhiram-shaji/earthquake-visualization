// Import the HTTP module to create a server
const http = require('http');
// Import the File System module to read files
const fs = require('fs');
// Import the Path module for handling file paths
const path = require('path');

// Create the HTTP server
const server = http.createServer((req, res) => {
    // Check if the request URL is for the homepage or the index.html file
    if (req.url === '/' || req.url === '/index.html') {
        // Read the index.html file
        fs.readFile('index.html', (err, data) => {
            // If there's an error reading the file
            if (err) {
                // Send a 404 response
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                // If the file is read successfully, send a 200 response with the HTML content
                res.writeHead(200, { 'Content-Type': 'text/html' });
                res.end(data);
            }
        });
    }
    // Check if the request URL is for the app.js file
    else if (req.url === '/app.js') {
        // Read the app.js file
        fs.readFile('app.js', (err, data) => {
            // If there's an error reading the file
            if (err) {
                // Send a 404 response
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                // If the file is read successfully, send a 200 response with the JavaScript content
                res.writeHead(200, { 'Content-Type': 'application/javascript' });
                res.end(data);
            }
        });
    }
    // If the request URL doesn't match any of the above routes
    else {
        // Send a 404 response
        res.writeHead(404);
        res.end('404 Not Found');
    }
});

// Set the server to listen on port 3000
server.listen(3000, () => {
    // Log a message when the server is running
    console.log('Server is running on http://localhost:3000');
});
