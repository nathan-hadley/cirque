# MailerSend Setup and Usage

## Goal
Send the submission payload as a plain-text email via MailerSend from the Cloudflare Worker.

## Prerequisites
- MailerSend account with a verified sending domain
- API token with Email permissions

## Required Environment Variables
- `MAILERSEND_API_TOKEN`
- `MAILERSEND_FROM_EMAIL`
- `MAILERSEND_TO_EMAIL`

These are configured as secrets/vars in the Cloudflare Worker (see `docs/cloudflare-worker-setup.md`).

## API Endpoint
- HTTPS: `POST https://api.mailersend.com/v1/email`
- Auth: Bearer token in `Authorization` header

## Minimal Request Shape
```json
{
  "from": { "email": "no-reply@your-domain.com" },
  "to": [{ "email": "dest@your-domain.com" }],
  "subject": "New problem submission",
  "text": "...plain text body..."
}
```

## Example curl (local test)
```bash
curl -X POST \
  https://api.mailersend.com/v1/email \
  -H "Authorization: Bearer $MAILERSEND_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "from": { "email": "'"$MAILERSEND_FROM_EMAIL"'" },
    "to": [{ "email": "'"$MAILERSEND_TO_EMAIL"'" }],
    "subject": "New problem submission (test)",
    "text": "Hello from curl test"
  }'
```

## Formatting the Submission
In the Worker, stringify the JSON submission for the `text` field. For larger payloads, consider summarizing key fields and linking to an artifact later (e.g., R2) if needed.

## Official Documentation
- MailerSend API Reference: `https://developers.mailersend.com/api/v1/`
- Authentication: `https://developers.mailersend.com/#authentication`

