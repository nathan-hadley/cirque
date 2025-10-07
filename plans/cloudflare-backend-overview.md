# Cloudflare Backend Overview (Email now, GitHub PR later)

## Goal
Use Cloudflare Workers as a micro-backend to accept problem submissions from the app. Start with an email transport; later switch to auto GitHub PRs without changing the app.

## API
- POST `/v1/contributions`
  - Headers: `Idempotency-Key: <uuid>`
  - Body: `ProblemSubmission` (contact, problem fields, optional `imageBase64`)
  - Response: `{ submissionId, status, url? }` (PR or email message URL)

## Cloudflare Components
- Workers: HTTP endpoint + validation (zod) + enqueue
- Queues: background processing and retries
- D1 or KV: idempotency keys and submission status log
- R2 (optional): store large images; email includes a signed URL
- Secrets: email provider key now; GitHub App credentials later

## Transports
- Email (now): Subject `New problem: {name} in {subarea} (grade {grade})`; body contains fenced JSON Feature; attach image or link from R2
- GitHub (later): create branch, update `problems.geojson`, add image, open PR; return PR URL

## Bindings (wrangler.toml excerpt)
```
[vars]
EMAIL_TO = "cirquebouldering@gmail.com"
TRANSPORT = "email" # later: "github" or "both"

[[queues.producers]]
queue = "contributions-queue"
binding = "CONTRIBUTIONS_QUEUE"

[[queues.consumers]]
queue = "contributions-queue"

[[d1_databases]]
binding = "CONTRIBUTIONS_DB"
database_name = "contributions"

[[r2_buckets]]
binding = "TOPO_BUCKET"
bucket_name = "cirque-topos"
```

## Frontend Impact
- App posts the same payload now and later
- Offline queue unchanged; retries continue to work
- When PR transport is enabled, the app simply shows the returned PR URL

See `plans/contribute-tab-implementation.md` for full details and phases.

