# Contribute Tab Implementation Plan

## Overview
Build a contribute flow that lets users submit new problems with offline support, drawing on images, and a micro-backend on Cloudflare. Start by emailing submissions to maintainers; later switch the backend transport to auto-create GitHub PRs without frontend changes.

## Current Architecture Snapshot
- **Tabs**: `react-native/app/(tabs)/_layout.tsx`
- **Problem format**: GeoJSON Feature with `properties` (name, grade, subarea, color, order, description, topo, line as JSON string) and `geometry` Point
- **Subareas**: Barney's Rubble, Clamshell Cave, Straightaways, Forestland, Swiftwater
- **UI**: gluestack-ui + NativeWind; **State**: Zustand
- **Topos**: `react-native/assets/topos/` using `{subarea}-{problem-name}.jpeg`
- **Sync**: Node scripts convert GeoJSON to TS assets

## Scope and Key Decisions
- **Offline-first**: Queue submissions locally; auto-sync when online; retries with backoff
- **Drawing**: Skia for path drawing and 6-point coordinate extraction (scaled to image size)
- **Backend on Cloudflare**: Single endpoint receives submissions; transport is pluggable: `email` now → `github` later
- **Privacy**: Contact info only in email/PR body; never stored in GeoJSON
- **Security**: No secrets in the app; secrets only in Cloudflare environment

## Data Flow (end-to-end)
1. Form validate → image pick/resize → draw line → build canonical submission payload
2. Save to offline queue; when online, POST to Cloudflare `/v1/contributions` with idempotency key
3. Worker validates and enqueues to Cloudflare Queues; consumer runs transport:
   - Now: EmailTransport formats JSON body and attaches image (or R2 link)
   - Later: GitHubTransport updates `problems.geojson`, uploads image, opens PR
4. App shows status and any returned link (e.g., PR URL); retries on failure

## Minimal Interfaces (conceptual)
```ts
interface ProblemSubmission {
  contact: { name: string; email: string };
  problem: {
    name: string; grade: string; subarea: string; color: string; order: number;
    description?: string; lat: number; lng: number; line: number[][]; // 6 points
    topoFilename?: string; imageBase64?: string; // if new image
  };
}
```

## Backend API on Cloudflare (now) + GitHub PR (later)
- **Endpoint**: `POST /v1/contributions`
  - Headers: `Idempotency-Key` (UUID recommended)
  - Body: `ProblemSubmission`
  - Response: `{ submissionId, status, url? }` (url is email provider message URL or later PR URL)
- **Components**:
  - Cloudflare Workers: HTTP API and job producer
  - Cloudflare Queues: background processing and retries
  - D1 (or KV): idempotency keys + submission status log
  - R2 (optional): upload image if too large for email attachment; email includes signed URL
  - Secrets: email provider API key now; GitHub App creds later (app id, installation id, private key)
- **Transports (pluggable)**:
  - EmailTransport (SendGrid/Mailgun/Resend via HTTPS): subject `New problem: {name} in {subarea} (grade {grade})`, body contains fenced JSON Feature; attach image or R2 link
  - GitHubTransport (later): create branch, update `cirque-data/problems/problems.geojson`, add image under `react-native/assets/topos/`, open PR, return PR URL/number
- **Validation**: strict schema (zod) and filename sanitization in Worker; size limits (e.g., 5MB); reject early with clear messages
- **Idempotency**: store `(key, hash(payload), result, createdAt)`; if seen, return stored result

## Frontend Integration (unchanged UX)
- Replace GitHub calls with `SubmissionService.submit(payload)` → POST Worker
- Keep offline queue, retries, and progress UI
- Show returned URL when available (PR later)

## File Structure (targets)
```
# Frontend (unchanged targets)
react-native/app/(tabs)/contribute.tsx
react-native/components/contribute/ContributeForm.tsx
react-native/components/contribute/ImageDrawingCanvas.tsx
react-native/components/contribute/SubareaSelector.tsx
react-native/components/contribute/CoordinateInput.tsx
react-native/components/contribute/OfflineQueueStatus.tsx
react-native/stores/contributeStore.ts
react-native/services/offlineQueueService.ts
react-native/services/imageService.ts
react-native/services/submissionService.ts    # calls Cloudflare API

# Backend (Cloudflare Workers)
cloudflare/wrangler.toml
cloudflare/src/index.ts                      # Router & bindings
cloudflare/src/routes/contributions.ts       # POST /v1/contributions
cloudflare/src/schema/submission.ts          # zod schema + normalization
cloudflare/src/queue/consumer.ts             # Queue consumer handler
cloudflare/src/transports/email.ts           # EmailTransport (now)
cloudflare/src/transports/github.ts          # GitHubTransport (later)
cloudflare/src/lib/idempotency.ts            # D1/KV helpers
cloudflare/src/lib/r2.ts                     # R2 upload + signed URL (optional)
```

## Cloudflare Bindings (indicative)
```
# wrangler.toml (excerpt)
name = "cirque-contributions"
main = "cloudflare/src/index.ts"
compatibility_date = "2025-01-01"

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

# Secrets (set via wrangler secret)
# EMAIL_API_KEY, EMAIL_FROM
# GITHUB_APP_ID, GITHUB_INSTALLATION_ID, GITHUB_PRIVATE_KEY_B64
```

## Security and Privacy (non-negotiables)
- No secrets in the app; secrets only as Worker bindings/secrets
- Validate and sanitize all inputs; enforce image limits; strip contact info from GeoJSON
- CORS allowlist the mobile app origin; rate limit by IP/device fingerprint if needed
- Store only what’s necessary for idempotency/audit; avoid PII persistence beyond email sending

## Implementation Phases

### Phase 1: Backend foundation on Cloudflare
- Bootstrap Worker, Queues, and D1 schema (idempotency + submissions log)
- Add `/v1/contributions` with schema validation, idempotency, and queue enqueue

### Phase 2: Email transport (now)
- Implement EmailTransport using provider API; attach image or upload to R2 and link when too large
- Observability: log outcomes; return provider message URL when available

### Phase 3: Frontend wiring
- Implement `submissionService.ts` (POST to Worker) and integrate with offline queue
- Map server statuses to user-facing progress and errors

### Phase 4: Drawing and UX polish
- Skia canvas, 6-point extraction, scaling; validation and clear errors
- Progress, retries, autosave; link display from server response

### Phase 5: Reliability and safeguards
- Backoff and dead-letter handling in Queues; idempotent replays
- Size limits, filename sanitation, and helpful error messages

### Phase 6: Add GitHub PR transport (later)
- Implement GitHubTransport with App credentials (server-side only)
- Config flip `TRANSPORT=github` (or `both` for canary); expose PR URL in response

### Phase 7: Release readiness
- Production smoke tests (end-to-end email, then PR when ready)
- Reviewer playbook and submission success monitoring

## Notes
- Keep detailed setup commands in contributor docs, not here
- Frontend remains stable across the switch from email → GitHub PR; only backend config changes
