# Online Setup (Dashboards, DNS, and Config)

This guide covers the non-code configuration in MailerSend and Cloudflare needed for the Worker that emails submissions.

## MailerSend (dashboard)
1. Create account and verify sending domain
   - Add domain in MailerSend → Domains
   - Publish DNS records for SPF and DKIM in your DNS host
   - Optional but recommended: DMARC policy for your domain
2. Create an API token
   - MailerSend → API Tokens → Generate new token (Email scope)
   - Store securely; you will set this as a Worker secret
3. Determine sender and recipient
   - Choose a verified `from` email under your verified domain
   - Choose `to` recipient(s) for receiving submissions

Helpful links:
- Domain verification (SPF/DKIM): `https://www.mailersend.com/help/email-domain-setup`
- API reference (send email): `https://developers.mailersend.com/api/v1/`
- Authentication: `https://developers.mailersend.com/#authentication`

## Cloudflare (dashboard)
1. Create account and pick `workers.dev` subdomain
   - Cloudflare Dashboard → Workers → Set your `workers.dev` subdomain
2. Create a Worker
   - Workers & Pages → Create application → Worker → Name it (e.g., `cirque-api`)
   - Use this Worker for receiving `POST /v1/problem`
3. Configure environment variables/secrets
   - Workers & Pages → Your Worker → Settings → Variables
   - Add secrets/vars:
     - `MAILERSEND_API_TOKEN`
     - `MAILERSEND_FROM_EMAIL`
     - `MAILERSEND_TO_EMAIL`
4. Routes / custom domain (optional)
   - If you have a domain on Cloudflare: Workers → Triggers → Add Route (e.g., `api.example.com/*`)
   - Or bind a custom hostname to the Worker
   - Otherwise, use the default `*.workers.dev` URL
5. CORS considerations
   - Allow only your app origins (e.g., production app URL) in `Access-Control-Allow-Origin`
   - Set `Access-Control-Allow-Methods: POST, OPTIONS`
   - Support preflight `OPTIONS`
6. Basic observability
   - Enable Logs → Tail during testing
   - Optionally add Analytics Engine/Logs for request counts and errors

Helpful links:
- Workers quickstart: `https://developers.cloudflare.com/workers/get-started/guide/`
- Wrangler CLI (for future code deploys): `https://developers.cloudflare.com/workers/wrangler/`
- Secrets and variables: `https://developers.cloudflare.com/workers/configuration/secrets/`
- Routes and custom domains: `https://developers.cloudflare.com/workers/configuration/routing/`
- CORS guidance: `https://developers.cloudflare.com/workers/examples/cors/`

## Smoke test checklist (no code changes)
- You can access the Worker URL (workers.dev or custom route)
- A `POST` to `/v1/problem` from a tool like `curl` or Postman returns a JSON response
- MailerSend activity shows a delivered/test email

If any step fails, verify DNS propagation, token scopes, secrets, and that the Worker is attached to the correct route.