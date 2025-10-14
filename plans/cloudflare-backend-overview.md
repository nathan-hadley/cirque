# Cloudflare Backend Overview (Simplified: MailerSend only)

## Goal
Very basic micro-backend on Cloudflare Workers that accepts problem submissions and forwards them via the MailerSend API. Keep it to a couple of files.

## API
- POST `/v1/problem`
  - Body: raw JSON payload from the app (no strict schema initially)
  - Response: `{ ok: true }` on success; `{ error }` otherwise

## Cloudflare Pieces (minimal)
- Worker: single `fetch` handler with CORS, routes only `POST /v1/problem`
- No Queues, no D1/KV, no R2 to start
- Secrets: `MAILERSEND_API_TOKEN`, `MAILERSEND_FROM_EMAIL`, `MAILERSEND_TO_EMAIL`

## MailerSend
- HTTPS API: `POST https://api.mailersend.com/v1/email`
- Subject: `New problem submission`; body is the full JSON submission as plain text

## Monorepo Layout (planned)
```
api/
  wrangler.toml
  src/index.ts
```

## Example `wrangler.toml` (indicative)
```
name = "cirque-api"
main = "src/index.ts"
compatibility_date = "2024-10-01"

[vars]
MAILERSEND_API_TOKEN = ""
MAILERSEND_FROM_EMAIL = ""
MAILERSEND_TO_EMAIL = ""
```

## Frontend Impact
- App posts JSON to `/v1/problem`
- Offline queue/retries remain app-side; backend is stateless

See `plans/contribute-tab-implementation.md` for UI and submission flow details.

