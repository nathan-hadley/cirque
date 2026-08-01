# Versioned topo image URLs

Issue: #61 — Topo image URLs aren't versioned, so expo-image caches can go stale after re-encodes.

## Problem

Topo images are stored in R2 at stable keys (`topos/{slug}/full.webp`, `topos/{slug}/thumb.webp`)
and served with `Cache-Control: public, max-age=86400` plus a Cloudflare edge cache. The React
Native app renders them through `expo-image`, which caches to disk with no revalidation.

When an object is rewritten in place — as `cirque-api/scripts/reencode-submitted-topos.mjs` (#57)
does — the URL is unchanged, so expo-image (disk cache), the edge cache, and any R2 `max-age`
window all keep serving the old bytes until eviction. Clients that already viewed or
bulk-downloaded a topo never see the re-encoded image.

## Fix

Make a changed image a changed URL by embedding the R2 content hash (etag) as a `?v=` query
parameter. The hash must reach **both** URL builders in the app, and both must produce the
*identical* URL so a download-prefetch warms the exact cache entry the live view later reads.

## Source of truth: R2 etag, derived at request time

The per-topo hash is the R2 object `etag` (content-derived MD5) — the same value the images
manifest already computes. Deriving it at request time keeps a single source of truth:

- No D1 migration, no backfill.
- No change to the reencode script (or any future image-mutating pipeline): rewriting an R2
  object changes its etag automatically, so the URL changes automatically and caches self-heal.
- `/v1/data` and the manifest cannot drift, because both read the same R2 listing.

Cost: `getData` performs one `IMAGES.list({ prefix: "topos/" })` — the same paginated listing the
manifest already does, bounded by topo count — run in parallel with the existing D1 batch.

## URL form: `?v={hash}` query parameter

`/images/topos/{slug}/full.webp?v={etag}`.

- R2 keys are unchanged. `getImage` derives the R2 key from `c.req.path` and ignores the query, so
  `IMAGES.get(key)` and `isServableImageKey` need no changes.
- The Cloudflare edge cache (`caches.default`, keyed on `c.req.raw`) and `expo-image` both key on
  the full URL including the query, so a new hash is a new cache entry — the bust works end to end.

Rejected: path-embedded `full.{hash}.webp` would require renaming R2 keys or teaching
`getImage` + `isServableImageKey` + the manifest matcher to strip the hash segment, for no
cache-busting advantage.

## Changes

### API — `cirque-api/src/dataApi.mjs` (pure, unit-testable)

1. New `buildTopoHashMap(r2Objects)` → `Map<topoKey, fullEtag>`, reusing the existing
   `topos/.../(full|thumb).webp` parse. Maps a topoKey prefix (`topos/{slug}`) to its `full`
   variant's etag.
2. `problemRowToFeature` / `buildDataPayload` accept the hash map and set
   `properties.topoHash` = the topo's `full` etag, or `null` when there is no image.
3. `computeEtag` folds in an images component (`count:maxUploaded` from the R2 listing) so a
   reencode — which bumps R2 `uploaded` but not the problem row's `updated_at` — changes the
   `/v1/data` ETag. Without this the client 304s and keeps the stale hash; this is what makes the
   self-heal actually reach the app.
4. `buildManifest` appends `?v=${etag}` to `fullUrl` and `thumbUrl`, using each variant's own etag.

### API — `cirque-api/src/endpoints/data.ts`

- `getData` runs the `topos/` R2 list in parallel with the D1 batch (`Promise.all`), then passes
  the listed objects into both the ETag calc and the payload builder.

### App — `react-native`

- `constants/api.ts`: `topoImageUrl(topoKey, variant, hash?)` appends `?v=${hash}` when a hash is
  present; output is unchanged when it is absent (safe fallback for images-less topos and the
  Contribute flow).
- `models/problems.ts`: add `topoHash?: string` to `Problem`.
- `stores/problemStore.ts`: map `properties.topoHash` into the parsed problem.
- `screens/MapScreen/ProblemSheet/index.tsx`: pass `problem.topoHash` into `topoImageUrl`.
- `hooks/useTopoDownload.ts`: **no change** — the manifest URLs now arrive with `?v=` already
  built, and because both paths use the same etag, the prefetch warms the exact entry the live
  view reads.

## Out of scope

- `screens/Contribute/ProblemPicker.tsx` builds a topoKey from a slug during contribution and has
  no problem-hash available; it keeps current behavior (no `?v=`). This is a preview of an image
  the user is actively working with, not a cache-sensitive read path.

## Testing

- `cirque-api/src/dataApi.test.ts` (extend):
  - `buildTopoHashMap` maps topoKey → full etag; ignores non-topo keys; handles missing thumb.
  - `buildDataPayload` sets `topoHash` from the map, `null` when a topo has no image.
  - `computeEtag` changes when the images component changes (reencode with same `updated_at`).
  - `buildManifest` emits `?v={etag}` on both `fullUrl` and `thumbUrl`, per-variant.
- `react-native/constants/api.test.ts` (extend): `topoImageUrl` appends `?v=` with a hash, omits
  it without one, and still returns `undefined` for null/undefined topoKey.
