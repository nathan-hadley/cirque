# Cloudflare Worker Setup (Wrangler + Deploy)

This guide covers the CLI-based steps for developing and deploying the Worker that forwards submissions to MailerSend.

## Prerequisites
- Cloudflare account
- Node.js (LTS)
- Wrangler CLI: `npm i -g wrangler`

## Authenticate
```bash
wrangler login
```
This opens a browser window for Cloudflare auth.

## Project skeleton (suggested)
```
api/
  wrangler.toml
  src/index.ts
```
- `wrangler.toml` minimal example:
```toml
name = "cirque-api"
main = "src/index.ts"
compatibility_date = "2024-10-01"

[vars]
# Non-sensitive defaults (override in dashboard if needed)
MAILERSEND_FROM_EMAIL = ""
MAILERSEND_TO_EMAIL = ""
```

## Secrets and variables
Set sensitive values as secrets (never commit tokens):
```bash
wrangler secret put MAILERSEND_API_TOKEN
```
Non-sensitive config can be set via `[vars]` in `wrangler.toml` or with environment variables.

References:
- Secrets: `https://developers.cloudflare.com/workers/configuration/secrets/`
- Environment variables: `https://developers.cloudflare.com/workers/configuration/environment-variables/`

## Develop locally
```bash
wrangler dev
```
- Sends requests to your Worker locally with live reload
- Use a REST client or `curl` to hit `/v1/problem`

## Deploy
```bash
wrangler deploy
```
- Outputs the `*.workers.dev` URL
- You can tail logs during testing:
```bash
wrangler tail
```

## Routes / custom domain (optional)
- Attach routes to your zone or map a custom hostname to the Worker
- Configure in dashboard or via `wrangler.toml`

References:
- Routing: `https://developers.cloudflare.com/workers/configuration/routing/`
- Workers quickstart: `https://developers.cloudflare.com/workers/get-started/guide/`
- CORS examples: `https://developers.cloudflare.com/workers/examples/cors/`

## Checklist
- `MAILERSEND_API_TOKEN` secret set
- `MAILERSEND_FROM_EMAIL` and `MAILERSEND_TO_EMAIL` set
- `wrangler dev` returns JSON on `POST /v1/problem`
- Deploy succeeds and URL responds