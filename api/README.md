# Cirque API - Cloudflare Worker

Minimal Cloudflare Worker API for handling problem submissions from the Cirque mobile app.

## Overview

This is a simple, stateless API that:
- Accepts problem submissions via `POST /v1/problem`
- Validates and sanitizes input
- Forwards submissions to MailerSend as email
- Implements rate limiting (10 requests per hour per IP)
- Provides CORS support for mobile app

## Setup

### Prerequisites

- [Node.js](https://nodejs.org/) 18 or later
- [pnpm](https://pnpm.io/) package manager
- Cloudflare account (free tier works)
- [MailerSend](https://www.mailersend.com/) account (free tier works)

### Installation

```bash
cd api
pnpm install
```

### Configuration

#### Local Development

1. Copy the example environment file:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Fill in your MailerSend credentials in `.dev.vars`:
   ```
   MAILERSEND_API_TOKEN=your_token_here
   MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
   MAILERSEND_TO_EMAIL=admin@yourdomain.com
   ```

#### Production Secrets

For production, set secrets using Wrangler CLI:

```bash
# Set secrets for production
wrangler secret put MAILERSEND_API_TOKEN --env production
wrangler secret put MAILERSEND_FROM_EMAIL --env production
wrangler secret put MAILERSEND_TO_EMAIL --env production

# Or for staging
wrangler secret put MAILERSEND_API_TOKEN --env staging
wrangler secret put MAILERSEND_FROM_EMAIL --env staging
wrangler secret put MAILERSEND_TO_EMAIL --env staging
```

## Development

Start the local development server:

```bash
pnpm dev
```

The API will be available at `http://localhost:8787`

### Testing the API

Test the health endpoint:
```bash
curl http://localhost:8787/health
```

Test problem submission:
```bash
curl -X POST http://localhost:8787/v1/problem \
  -H "Content-Type: application/json" \
  -d '{
    "contact": {
      "name": "Test User",
      "email": "test@example.com"
    },
    "problem": {
      "name": "Test Problem",
      "grade": "V3",
      "subarea": "Barneys Rubble",
      "color": "red",
      "order": 1,
      "description": "A test problem",
      "lat": 44.1234,
      "lng": -71.5678,
      "line": [[0.1, 0.2], [0.3, 0.4], [0.5, 0.6]]
    }
  }'
```

## Deployment

### Deploy to Staging

```bash
pnpm deploy:staging
```

### Deploy to Production

```bash
pnpm deploy:production
```

After deployment, Cloudflare will provide a URL like:
- Production: `https://cirque-api.<your-subdomain>.workers.dev`
- Staging: `https://cirque-api-staging.<your-subdomain>.workers.dev`

## API Endpoints

### `POST /v1/problem`

Submit a new problem for review.

**Request Body:**
```typescript
{
  contact: {
    name: string;
    email: string;
  };
  problem: {
    name: string;
    grade: string;
    subarea: string;
    color: string;
    order: number;
    description?: string;
    lat: number;
    lng: number;
    line: number[][]; // normalized points
    topoFilename?: string;
    imageBase64?: string;
  };
}
```

**Response:**
```json
{ "ok": true }
```

**Error Response:**
```json
{ "ok": false, "error": "Error message" }
```

**Rate Limiting:**
- 10 requests per hour per IP address
- Returns 429 status when limit exceeded

### `GET /health`

Health check endpoint.

**Response:**
```json
{ "ok": true, "status": "healthy" }
```

## Security Features

- Input validation and sanitization
- Email format validation
- Size limits on all fields (name: 200 chars, description: 2000 chars, image: ~10MB)
- Line point limit (max 1000 points)
- Coordinate validation (valid lat/lng ranges)
- Rate limiting per IP address
- CORS headers (currently allows all origins - TODO: restrict in production)

## Architecture Notes

- **Stateless**: No database or queue; submissions are immediately forwarded to email
- **In-memory rate limiting**: Rate limits reset when worker restarts (typically every few hours)
- **No PII storage**: Contact information is only sent via email, never stored
- **Minimal dependencies**: Uses only Cloudflare Workers runtime and MailerSend API

## Monitoring

View real-time logs:
```bash
pnpm tail
```

## Future Enhancements

- [ ] Restrict CORS to specific app origin
- [ ] Add Cloudflare Durable Objects for persistent rate limiting
- [ ] Add request signing/authentication
- [ ] Store submissions in Cloudflare R2 for backup
- [ ] Add webhook support for automated PR creation

## Related Documentation

- [MailerSend Setup Guide](../docs/mailersend-setup.md)
- [Cloudflare Worker Setup Guide](../docs/cloudflare-worker-setup.md)
- [Contribute Tab Implementation Plan](../plans/contribute-tab-implementation.md)
