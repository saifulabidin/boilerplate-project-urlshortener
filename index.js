require('dotenv').config();
const express = require('express');
const cors = require('cors');
const dns = require('dns');
const url = require('url');
const bodyParser = require('body-parser');
const app = express();

// Basic Configuration
const port = process.env.PORT || 3000;

// URL storage
let urlDatabase = {};
let shortUrlCounter = 1;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Your first API endpoint
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

// URL shortener endpoint - creates a short URL
app.post('/api/shorturl', function(req, res) {
  const originalUrl = req.body.url;
  
  // Check if URL is valid
  try {
    const parsedUrl = new URL(originalUrl);
    
    // Use only http/https protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return res.json({ error: 'invalid url' });
    }
    
    // Extract hostname for DNS lookup
    const hostname = parsedUrl.hostname;
    
    // Check if hostname is valid via DNS lookup
    dns.lookup(hostname, (err) => {
      if (err) {
        return res.json({ error: 'invalid url' });
      }
      
      // Check if URL already exists in our database
      for (const key in urlDatabase) {
        if (urlDatabase[key] === originalUrl) {
          return res.json({
            original_url: originalUrl,
            short_url: parseInt(key)
          });
        }
      }
      
      // Add new URL to database
      const shortUrl = shortUrlCounter++;
      urlDatabase[shortUrl] = originalUrl;
      
      // Return the result
      res.json({
        original_url: originalUrl,
        short_url: shortUrl
      });
    });
  } catch (error) {
    // URL parsing failed
    return res.json({ error: 'invalid url' });
  }
});

// Redirect endpoint - redirects to the original URL
app.get('/api/shorturl/:short_url', function(req, res) {
  const shortUrl = req.params.short_url;
  
  // Check if short URL exists in our database
  if (urlDatabase[shortUrl]) {
    // Redirect to the original URL
    return res.redirect(urlDatabase[shortUrl]);
  } else {
    // Short URL not found
    return res.json({ error: 'No short URL found for the given input' });
  }
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
