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

## Possible File Structure
```
# Frontend
react-native/app/(tabs)/contribute.tsx
react-native/screens/Contribute/index.tsx
react-native/screens/Contribute/ImageDrawingCanvas.tsx
react-native/screens/Contribute/CoordinateInput.tsx
react-native/stores/contributeStore.ts
react-native/services/offlineQueueService.ts
react-native/services/imageService.ts
react-native/services/submissionService.ts

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
- Validate and sanitize all inputs; enforce image limits; contact info should not make it into GeoJSON
- CORS allowlist the mobile app origin; rate limit by IP/device fingerprint if needed
- Store only what's necessary for idempotency/audit; avoid PII persistence beyond email sending

## Development Phases

### Phase 1: Foundation & Form
- Add contribute tab to `_layout.tsx`
- Create basic `contribute.tsx` and `Contribute/index.tsx` screens
- Build problem details form (name, grade, subarea, description)
- Add coordinate input component with map picker
- Implement client-side validation

### Phase 2: Image & Drawing
- Create image picker/camera integration with size/format validation
- Build SVG drawing canvas with gesture handler
- Implement line drawing, clear/reset functionality
- Store normalized points and base64 image data

### Phase 3: Backend API (parallel with Phase 2)
- Set up Cloudflare Worker project structure
- Implement `/v1/problem` endpoint with MailerSend integration
- Add CORS configuration and rate limiting
- Validate and sanitize inputs server-side

### Phase 4: Offline Queue & Storage
- Create `offlineQueueService.ts` and `contributeStore.ts`
- Implement local submission storage with retry logic
- Add online/offline detection and auto-sync with backoff
- **Testing checkpoint**: Verify queue persistence and retry behavior

### Phase 5: Integration & Error Handling
- Connect frontend to backend API via `submissionService.ts`
- Implement proper error handling for network failures
- Add progress indicators and success/error UI states
- Handle edge cases (network timeout, malformed responses)
- **Testing checkpoint**: End-to-end submission flow

### Phase 6: Security & UX Polish
- Enforce image size limits and file type restrictions
- Add network error recovery UX (retry prompts, queue visibility)
- Implement loading states and optimistic UI updates
- Verify no secrets in app bundle
- Audit contact info flow (never persisted in GeoJSON)
- Final security review and user acceptance testing