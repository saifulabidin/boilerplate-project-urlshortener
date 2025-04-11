require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const dns = require('dns');
const url = require('url');

// Basic Configuration
const port = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/public', express.static(`${process.cwd()}/public`));

// Root route
app.get('/', (req, res) => {
    res.sendFile(process.cwd() + '/public/index.html');
});

// Array to store URLs
const URLs = [];
let id = 0;

// POST request to shorten URL
app.post('/api/shorturl', (req, res) => {
    const { url: _url } = req.body;

    // Check if URL is empty
    if (!_url) {
        return res.json({ error: "invalid url" });
    }

    // Validate URL format
    let parsedUrl;
    try {
        parsedUrl = new URL(_url);
        if (!parsedUrl.protocol.match(/^https?:$/)) {
            return res.json({ error: "invalid url" });
        }
    } catch (err) {
        return res.json({ error: "invalid url" });
    }

    const hostname = parsedUrl.hostname;

    // Validate hostname with DNS lookup
    dns.lookup(hostname, (err) => {
        if (err) {
            console.log(`DNS lookup failed for ${hostname}: ${err.message}`);
            return res.json({ error: "invalid url" });
        }

        // Check if URL already exists
        const linkExists = URLs.find(l => l.original_url === _url);
        if (linkExists) {
            return res.json({
                original_url: linkExists.original_url,
                short_url: linkExists.short_url
            });
        }

        // Increment ID and create new entry
        id += 1;
        const urlObject = {
            original_url: _url,
            short_url: id // Keep as number for consistency
        };
        URLs.push(urlObject);

        return res.json({
            original_url: _url,
            short_url: id
        });
    });
});

// GET request to redirect short URL
app.get('/api/shorturl/:id', (req, res) => {
    const { id: _id } = req.params;
    const shortLink = URLs.find(sl => sl.short_url === parseInt(_id));

    if (shortLink) {
        return res.redirect(shortLink.original_url);
    } else {
        return res.json({ error: "invalid URL" });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});
