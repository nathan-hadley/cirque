# Cirque API - Cloudflare Worker

Minimal backend API for handling problem submissions from the Cirque mobile app. Forwards submissions via MailerSend email.

## Features

- **Single endpoint**: `POST /v1/problem` - Accepts problem submissions
- **Email forwarding**: Sends submissions to designated email via MailerSend
- **Security**: Rate limiting, input validation, and sanitization
- **CORS**: Configured for cross-origin requests
- **Stateless**: No database or queue dependencies

## Setup

### Prerequisites

- Node.js 18+ and pnpm
- Cloudflare account with Workers enabled
- MailerSend account with API token

### Installation

```bash
cd api
pnpm install
```

### Local Development

1. Copy the environment variables template:
   ```bash
   cp .dev.vars.example .dev.vars
   ```

2. Fill in your MailerSend credentials in `.dev.vars`:
   ```
   MAILERSEND_API_TOKEN=your_token
   MAILERSEND_FROM_EMAIL=noreply@yourdomain.com
   MAILERSEND_TO_EMAIL=submissions@yourdomain.com
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

The API will be available at `http://localhost:8787`

### Deployment

1. Set up your Cloudflare secrets (do this once):
   ```bash
   wrangler secret put MAILERSEND_API_TOKEN
   wrangler secret put MAILERSEND_FROM_EMAIL
   wrangler secret put MAILERSEND_TO_EMAIL
   ```

2. Deploy to Cloudflare:
   ```bash
   pnpm deploy
   ```

## API Endpoints

### POST /v1/problem

Submit a new problem.

**Request Body:**
```json
{
  "contact": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "problem": {
    "name": "The Traverse",
    "grade": "V5",
    "subarea": "Barney's Rubble",
    "color": "red",
    "order": 1,
    "description": "Classic traverse problem",
    "lat": 43.8563,
    "lng": -71.6937,
    "line": [[0.1, 0.2], [0.3, 0.4]],
    "topoFilename": "barneys-rubble-the-traverse.jpeg",
    "imageBase64": "base64_encoded_image_data"
  }
}
```

**Response (Success):**
```json
{
  "ok": true
}
```

**Response (Error):**
```json
{
  "error": "Error message"
}
```

### GET /health

Health check endpoint.

**Response:**
```json
{
  "status": "ok"
}
```

## Security Features

### Rate Limiting
- 10 requests per minute per IP address
- Returns `429 Too Many Requests` when exceeded
- Includes `Retry-After` header

### Input Validation
- Required fields checked
- Email format validated
- Coordinate ranges validated (-90 to 90 for lat, -180 to 180 for lng)
- Image size limited to 10MB

### Input Sanitization
- Strings trimmed and cleaned of potentially harmful characters
- HTML special characters removed from text fields

### CORS Configuration
- Currently allows all origins (`*`)
- TODO: Restrict to app domain in production
- Supports OPTIONS preflight requests

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `MAILERSEND_API_TOKEN` | MailerSend API token | `mlsn.abc123...` |
| `MAILERSEND_FROM_EMAIL` | Sender email address | `noreply@yourdomain.com` |
| `MAILERSEND_TO_EMAIL` | Recipient email address | `submissions@yourdomain.com` |

## Development Notes

- No database or persistent storage
- Stateless design - each request is independent
- Rate limiting is per-worker instance (in-memory)
- Contact information is only sent via email, never stored in GeoJSON
- All secrets must be configured via Cloudflare secrets, never committed to code

## Testing

Test the endpoint locally:

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
      "subarea": "Test Area",
      "color": "blue",
      "order": 1,
      "lat": 43.8563,
      "lng": -71.6937,
      "line": [[0.1, 0.2], [0.3, 0.4]]
    }
  }'
```

## Architecture

```
User submits problem → App (offline queue) → POST /v1/problem 
                                                ↓
                                          Validate & Sanitize
                                                ↓
                                          MailerSend API
                                                ↓
                                          Email to maintainer
```

## TODO

- [ ] Restrict CORS to specific app domain in production
- [ ] Add request signature verification for additional security
- [ ] Implement more sophisticated rate limiting (e.g., by device ID)
- [ ] Add monitoring and alerting integration
- [ ] Consider adding idempotency keys for duplicate prevention
