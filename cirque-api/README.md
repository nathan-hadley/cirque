# cirque-api

Cloudflare Worker serving all Cirque app data and topo images, per
[ADR 0001](../docs/adr/0001-cloud-source-of-truth.md). Hono + chanfana
(OpenAPI docs served at `/`).

Production: `https://cirque-api.nathan-hadley.workers.dev`

## Architecture

| Resource | Name | Holds |
| --- | --- | --- |
| D1 (`DB`) | `cirque-db` | `problems` rows (review workflow), `documents` GeoJSON blobs (`areas`, `boulders`, `subareas`, `subarea-centers`) |
| R2 (`IMAGES`) | `cirque-images` | `topos/{slug}/full.webp` + `thumb.webp` (640×480 / 320×240), `originals/{slug}.jpeg` archive, `backups/YYYY-MM-DD.json` |
| KV (`RATE_LIMIT_KV`) | — | per-IP rate-limit counters |

**Naming trap:** the cloud document `subareas` holds *polygons* and
`subarea-centers` holds *label points* — the legacy app asset names were
swapped. The app normalizes this once in `stores/dataStore.ts`.

## Endpoints

Public (API key via `X-API-Key`; reads 1000/day/IP, writes 50/day/IP):

- `GET /v1/data` — problems (approved + pending, PII stripped) as a
  FeatureCollection + the four documents. ETag revalidation (`If-None-Match` → 304).
- `GET /v1/images/manifest` — `{topoKey, fullUrl, thumbUrl, bytes, hash}` per topo.
- `POST /v1/problems` — inserts a `pending` row + uploads the image to R2.
  Idempotent via the client-generated id (primary key). Emails the admin.

No API key (public, edge-cached): `GET /images/topos/{slug}/(full|thumb).webp`
— key-allowlisted; `originals/` and `backups/` are never servable.

Admin (Cloudflare Access; JWT re-verified in-Worker, fail closed):

- `GET /admin` — review UI (list/filter/edit/approve/reject + document editor).
- `GET /v1/admin/problems`, `PUT /v1/admin/problems/:id`,
  `POST /v1/admin/problems/:id/(approve|reject)`,
  `GET|PUT /v1/admin/documents/:name`.

Cron (`0 9 * * *` UTC): full-fidelity dataset snapshot (PII included) to
`backups/`, pruned after 30 days (matches D1 time travel).

## Auth & secrets

Secrets (set via `npx wrangler secret put NAME`):

| Secret | Purpose |
| --- | --- |
| `API_KEY` | shared key baked into the app (`EXPO_PUBLIC_API_KEY`) |
| `MAILERSEND_API_TOKEN`, `CIRQUE_EMAIL` | submission notification email |
| `ACCESS_TEAM_DOMAIN` | Zero Trust team domain (`black-dream-de08.cloudflareaccess.com`) |
| `ACCESS_AUD` | Access application AUD tag |

Cloudflare Access app: Zero Trust → Access controls → Applications →
`cirque-api`, scoped to paths `admin` and `v1/admin` on the workers.dev
hostname, policy = allowed emails, One-time PIN login. If the team domain is
ever renamed, update the `ACCESS_TEAM_DOMAIN` secret to match. Do **not** use
the Worker's Domains-tab "Restricted" toggle — it walls off the whole
hostname including the public API.

## Local development

```sh
pnpm install
cp .dev.vars.example .dev.vars           # API_KEY=dev-key, ADMIN_DEV_BYPASS=true
node scripts/import-data.mjs --local     # seed local D1 (schema + data)
pnpm dev                                 # http://localhost:8787
```

`ADMIN_DEV_BYPASS` only works on localhost. Local R2 starts empty; seed a
topo with `npx wrangler r2 object put cirque-images/topos/<slug>/full.webp --file <f>`
(no `--remote`).

Tests: `pnpm test` (vitest). Deploy: `pnpm deploy`.

## Scripts

| Script | Purpose |
| --- | --- |
| `scripts/migrate-topos.mjs [--upload]` | one-off: re-encode the bundled back catalog → R2 (done 2026-07-04) |
| `scripts/import-data.mjs [--local\|--remote]` | bootstrap D1 from `cirque-data/` GeoJSON. **Do not re-run `--remote` now that live submissions exist** — REPLACE resets review state |
| `scripts/reencode-submitted-topos.mjs [--apply]` | rewrite app-submitted JPEGs (stored under `.webp` keys) as real WebP; run after approving submissions |

## Backups & restore

- Nightly `backups/YYYY-MM-DD.json` in R2 (30-day retention): full `problems`
  and `documents` tables as JSON.
- D1 also has 30-day point-in-time restore: `npx wrangler d1 time-travel`.
- Manual restore path: fetch the backup JSON
  (`npx wrangler r2 object get cirque-images/backups/<date>.json`), transform
  rows to `INSERT OR REPLACE` statements, apply via
  `npx wrangler d1 execute cirque-db --remote --file ...`.
