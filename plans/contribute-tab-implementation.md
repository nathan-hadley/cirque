# Contribute Tab Implementation Plan

## Overview

Build a contribute flow that lets users submit new problems with offline support and a very simple Cloudflare micro-backend that emails submissions via MailerSend. Keep the backend minimal and stateless.

## Current Architecture Snapshot
- **Tabs**: `react-native/app/(tabs)/_layout.tsx`
- **Problem format**: GeoJSON Feature with `properties` (name, grade, subarea, color, order, description, topo, line as JSON string) and `geometry` Point
- **Subareas**: Barney's Rubble, Clamshell Cave, Straightaways, Forestland, Swiftwater
- **UI**: gluestack-ui + NativeWind; **State**: Zustand
- **Topos**: `react-native/assets/topos/` using `{subarea}-{problem-name}.jpeg`
- **Sync**: Node scripts convert GeoJSON to TS assets

## Scope and Key Decisions
- **Offline-first**: Queue submissions locally; auto-sync when online; retries with backoff
- **Drawing**: Use react-native-svg overlay with react-native-gesture-handler; single saved gesture; clear/reset; store normalized points
- **Backend on Cloudflare**: Single minimal endpoint that sends an email via MailerSend
- **Privacy**: Contact info only in email body; never stored in GeoJSON
- **Security**: No secrets in the app; secrets only in Cloudflare environment

## Data Flow (end-to-end)
1. Form validate → image pick/resize → draw line → build canonical submission payload
2. Save to offline queue; when online, POST to Cloudflare `/v1/problem`
3. Worker forwards payload to MailerSend as an email (no queue/DB)
4. App shows success or error; retries on failure

## Minimal Interfaces (conceptual)
```ts
interface ProblemSubmission {
  contact: { name: string; email: string };
  problem: {
    name: string; grade: string; subarea: string; color: string; order: number;
    description?: string; lat: number; lng: number; line: number[][]; // normalized points
    topoFilename?: string; imageBase64?: string; // if new image
  };
}
```

## Backend API on Cloudflare (simplified)
- **Endpoint**: `POST /v1/problem`
  - Body: `ProblemSubmission` (same object used client-side; no strict schema enforced initially)
  - Response: `{ ok: true }` or `{ error }`
- **Components**:
  - Cloudflare Worker: single `fetch` handler with CORS
  - No Queues, no D1/KV, no R2
  - Secrets: MailerSend API token and emails
- **Transport**:
  - MailerSend via HTTPS: subject like `New problem submission`; body is the full JSON

## Frontend Integration (unchanged UX)
- Replace GitHub calls with `SubmissionService.submit(payload)` → POST Worker
- Keep offline queue, retries, and progress UI
- Show returned URL when available (PR later)

## File Structure (planned targets)
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

# Backend (Cloudflare Workers, minimal)
api/wrangler.toml
api/src/index.ts
```

## Cloudflare Bindings (indicative)
```
# wrangler.toml (excerpt)
name = "cirque-api"
main = "src/index.ts"
compatibility_date = "2024-10-01"

[vars]
MAILERSEND_API_TOKEN = ""
MAILERSEND_FROM_EMAIL = ""
MAILERSEND_TO_EMAIL = ""
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
- SVG overlay + gesture-handler; single saved gesture
- Store normalized [x,y] points; validation and clear errors; clear/reset to start over
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
