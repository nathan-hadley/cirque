# ADR 0001: Cloud as Source of Truth for App Data and Images

- **Status:** Accepted
- **Date:** 2026-07-03
- **Deciders:** Nathan Hadley

## Context

Today, all app data is baked into the app binary at build time:

- GeoJSON files in `cirque-data/` (`problems`, `boulders`, `areas`, `subareas`) are the
  source of truth. A sync script (`pnpm sync-data`) compiles them into TypeScript
  modules under `react-native/assets/`.
- 125 topo images (~88 MB, some over 1 MB each) are bundled into the binary and
  resolved via a hand-maintained `require()` map in `assets/topo-image.ts`.
- Problem submissions flow from the app to the Cloudflare Worker (`cirque-api`),
  which opens a GitHub PR against `cirque-data/`. A GitHub Action regenerates the
  TypeScript assets on merge.

This has two structural problems:

1. **Contributions are invisible until the next app release.** Even after a PR is
   reviewed and merged, the data only reaches users when a new binary ships. The
   feedback loop for a contributor is weeks, not seconds.
2. **The binary is bloated and grows with every topo.** 88 MB of images ship to
   every user regardless of need, and the `require()` map must be edited by hand.

The dataset is small (a few hundred features, well under 1 MB of JSON), and the
app must keep working fully offline — it is used in areas with no cell coverage.

## Decision

Move the source of truth for all custom data (problems, boulders, areas, subareas)
and all topo images to the cloud, served by the existing Cloudflare Worker. The
git repo ceases to be the data store. The app fetches data at runtime, caches it
for offline use, and retains a bundled snapshot as a first-launch/offline seed.

New contributions are written directly to the database with a `pending` status and
appear on the map for **all users immediately**, visually badged as pending review,
until an admin approves or rejects them.

### 1. Storage: Cloudflare D1 + R2

- **D1 (SQLite)** stores structured data. Problems are relational rows (they have
  workflow state and per-feature churn). Boulders, areas, and subareas — admin-edited
  and low-churn — are stored as whole GeoJSON documents in a `documents` table.
- **R2** stores topo images. R2 has zero egress fees, which matters because every
  install may download the full image set for offline use.
- No new vendors. Supabase was considered for its built-in auth and table-editor
  dashboard, but the only material advantage was the admin editing UI — which we
  need to build anyway for the approve/reject flow (see §4) — and its metered
  storage egress is a poor fit for the image-download pattern.

Schema sketch:

```sql
CREATE TABLE problems (
  id                 TEXT PRIMARY KEY,          -- client-generated UUID (also idempotency key)
  name               TEXT NOT NULL,
  grade              TEXT,
  subarea            TEXT,
  color              TEXT,
  sort_order         INTEGER,
  description        TEXT,
  lat                REAL NOT NULL,
  lng                REAL NOT NULL,
  line               TEXT,                      -- JSON [[x,y], ...] in topo pixel space
  topo_key           TEXT,                      -- R2 key prefix, e.g. "topos/{id}"
  status             TEXT NOT NULL DEFAULT 'pending'
                     CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by_name  TEXT,
  submitted_by_email TEXT,                      -- PII: never exposed in public payloads
  user_id            TEXT,                      -- NULL until accounts exist (see §5)
  device_id          TEXT,                      -- per-install UUID for local "my contributions"
  review_note        TEXT,
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL,
  reviewed_at        TEXT
);

CREATE TABLE documents (                        -- boulders, areas, subareas, subarea-centers
  name       TEXT PRIMARY KEY,
  geojson    TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### 2. API surface (extends existing `cirque-api` Worker)

Public (API key, rate-limited, as today):

- `GET /v1/data` — the full dataset: problems as a FeatureCollection (approved +
  pending, with a `status` property; submitter emails stripped), plus the boulder/
  area/subarea documents. Served with an `ETag` derived from `max(updated_at)`;
  clients revalidate with `If-None-Match`. The payload is < 1 MB, so a changed
  ETag triggers a full refetch — no delta protocol needed at this scale.
- `GET /v1/images/manifest` — list of `{problemId, thumbUrl, fullUrl, bytes, hash}`
  for the "download everything" flow and cache invalidation.
- `POST /v1/problems` — replaces the GitHub-PR flow: validates (same Zod schema),
  uploads the image to R2, inserts a `pending` row, sends the existing notification
  email (now linking to the admin page instead of a PR). Idempotency via the
  client-generated `id`, as today.

Admin (protected by Cloudflare Access):

- `GET /admin` — small static admin page served by the same Worker: table of
  problems with filters, edit forms, approve/reject buttons, and CRUD for the
  boulder/area/subarea documents. This is the "easy admin editing" replacement
  for editing GeoJSON in git.
- `POST /v1/admin/problems/:id/approve` / `.../reject` (with optional note),
  `PUT /v1/admin/problems/:id`, `PUT /v1/admin/documents/:name`.

### 3. App data layer: fetch, cache, bundled seed

- On launch (when online), the app revalidates `GET /v1/data` and stores the
  response on the filesystem. Rendering always reads from this local store —
  the network is only a refresh mechanism, so offline behavior is unchanged
  in kind from today.
- A **bundled snapshot** of the same payload ships in the binary, generated at
  build time by a script that hits `GET /v1/data` (replacing `sync-data`). First
  launch in the backcountry still shows a full map; the snapshot is only a fallback
  until the first successful fetch.
- **Images** load from R2 URLs via `expo-image`, which disk-caches every image
  viewed (the "incremental" path). The existing About-screen download UI (currently
  Mapbox tile packs) gains a "Download topo images" action that walks the manifest
  and prefetches everything (~15–25 MB after re-encoding). Finer-grained control
  (per-subarea packs, eviction) is deferred.
- Pending problems render for everyone with a distinct visual treatment (badge /
  muted styling) driven by the `status` property.

### 4. Review workflow

- Submission → `pending` row → notification email to admin with a deep link to
  `/admin`.
- Admin approves (status → `approved`, badge disappears on next client refresh),
  rejects (status → `rejected`, excluded from the public payload, optional note),
  or edits-then-approves.
- The GitHub PR automation (`docs/github-pr-automation.md`, `githubService.ts`,
  the sync GitHub Action) is retired.

### 5. Identity: deferred, schema-ready

No user accounts in this iteration. Rationale: pending items are visible to
everyone, so the app needs no per-user filtering to show a contributor their own
submission; and submissions already carry contact name + email for accountability
and follow-up. Sign-in (with Apple-mandated account deletion, etc.) is not worth
the friction yet.

The schema carries `submitted_by_*`, nullable `user_id`, and `device_id` from day
one so accounts can be added later without migration — the likely trigger being
edit submissions with reputation / trusted-contributor fast-tracking.

**PII note:** submitter emails now persist in D1 (previously transient in PRs and
email). Emails are only readable via admin endpoints, never in public payloads.
The privacy policy needs a corresponding update.

### 6. Images: re-encode and serve two variants

- Re-encode the existing 125-topo back catalog to match the constraints already
  enforced on new submissions (640×480), stored as WebP (~q80) in two variants:
  `topos/{id}/full.webp` and `topos/{id}/thumb.webp` (320×240). Expected corpus:
  ~88 MB → ~15–25 MB.
- Originals are archived in a private R2 prefix (`originals/`) in case higher-res
  serving is ever wanted; they are never served.
- New submissions keep the existing client-side pipeline (crop to 4:3, resize,
  ≤ 200 KB) and the Worker generates the thumb variant on upload.
- The hand-maintained `assets/topo-image.ts` `require()` map is deleted; images
  are addressed by `topo_key`.

### 7. Scope

- v1: **new problem contributions only** flow through the cloud pipeline. Edits to
  existing problems are the immediate follow-up (same schema; an edit becomes a
  pending revision referencing the target problem).
- Boulders, areas, and subareas are admin-edited via the admin page (not
  submittable from the app), but live in the same cloud store so admin changes
  also appear instantly.

## Migration plan

1. **Images:** script to re-encode the back catalog, upload variants to R2,
   archive originals.
2. **Database:** create D1 schema; import `problems.geojson` (all `approved`) and
   the boulder/area/subarea documents.
3. **API:** add `GET /v1/data`, `GET /v1/images/manifest`; build the `/admin` page
   behind Cloudflare Access; rewrite `POST /v1/problems` to write D1/R2 and drop
   `githubService`.
4. **App:** add the fetch/cache/seed data layer behind the existing stores
   (`problemStore` etc. read from it instead of `assets/*.ts`); switch image
   loading to R2 URLs with `expo-image`; add "Download topo images" to the About
   screen; render pending badges.
5. **Cleanup:** remove bundled topos and generated TS data modules from the binary
   (≈ 88 MB smaller); retire the sync-data GitHub Action and PR automation;
   archive `cirque-data/` (kept in history, no longer authoritative); update the
   privacy policy.
6. **Backups:** enable a scheduled Worker cron that snapshots the full dataset
   (JSON) to a versioned R2 prefix, alongside D1's built-in 30-day time travel.

Steps 1–3 can ship before the app changes; the current app keeps working off its
bundle until step 4 ships.

## Consequences

**Positive**

- Contributions (and admin edits) are visible to all users within one client
  refresh — no PR, no merge, no release.
- App binary shrinks by roughly 88 MB; image weight becomes opt-in.
- One data path: the app, the admin page, and the build-time seed all read the
  same `GET /v1/data`.
- Admin edits move from GeoJSON-in-git to purpose-built forms.

**Negative / accepted risks**

- We own an admin UI, a database, and backups instead of leaning on GitHub for
  review, history, and durability. Mitigated by D1 time travel + scheduled R2
  snapshots; human-readable history (git-style diffs) is lost.
- Pending content is publicly visible before review; junk or offensive
  submissions reach all users until rejected. Accepted for a small community;
  rate limiting stays, and a trusted-contributor / hold-for-review mechanism can
  be added later.
- Data freshness depends on the network; users who never connect after install
  see only the bundled seed. Accepted — identical in kind to today's staleness,
  strictly better in degree.
- Persisting submitter emails makes the database contain PII (see §5).

## Alternatives considered

- **Supabase** (Postgres + auth + dashboard): rejected — the table editor was the
  only decisive advantage, an admin page is needed regardless for review, and
  metered storage egress fits the offline-image-pack pattern poorly.
- **R2/KV GeoJSON blobs, no database:** rejected — per-feature workflow state
  (pending/approved) and concurrent edits inside whole-file blobs get awkward;
  D1 rows model the review lifecycle directly.
- **Keep git as store with automated export/backup:** rejected in favor of
  dropping git entirely; the admin page plus D1/R2 backups replace it. Bulk edits
  can still be done by exporting, editing, and re-importing via admin endpoints
  if ever needed.
- **User accounts now:** deferred (see §5).
