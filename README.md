# Snip Backend

Single-file Bun backend for the Snip URL shortener.

## Run

1. Install Bun 1.x.
2. Start the server:

   bun start

## Environment

- PORT (default: 3000)
- BASE_URL (origin used in short URLs)
- RAILWAY_PUBLIC_DOMAIN (fallback origin as https://<domain> when BASE_URL is not set)
- PUBLIC_DIR (optional static files directory; existing files are served before short-code redirects)

## API

- POST /api/links with JSON { "url": "https://example.com" }
- GET /api/links
- GET /:code
