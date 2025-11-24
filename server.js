const express = require('express');
const expressStaticGzip = require('express-static-gzip');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable gzip compression for static files
app.use('/', expressStaticGzip(path.join(__dirname), {
  enableBrotli: true,
  customCompressions: [{
    encodingName: 'deflate',
    fileExtension: 'zz'
  }],
  orderPreference: ['br', 'gzip']
}));

// Set proper MIME types for JavaScript modules
app.use((req, res, next) => {
  if (req.url.endsWith('.js')) {
    res.type('application/javascript');
  }
  next();
});

// Serve static files
app.use(express.static(__dirname, {
  maxAge: '1d', // Cache static assets for 1 day
  etag: true
}));

// Handle SPA routing - serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎮 NOODEL Word Game server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});