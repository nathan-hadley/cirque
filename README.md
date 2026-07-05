# Cirque Leavenworth

- [About](About.md)
- [Contributing Guidelines](Contributing.md)
- [Privacy Policy](Privacy_Policy.md)

## Data Management

### Adding new topos

- Export from Photos app
  - JPEG quality: Medium
  - Size: Medium

### App Data (ADR 0001)

All app data (problems, boulders, areas, subareas) and topo images live in the
cloud: Cloudflare D1 + R2, served by `cirque-api` (see
[ADR 0001](docs/adr/0001-cloud-source-of-truth.md)).

**Problem submission workflow:**

1. Users submit problems through the Contribute screen
2. `POST /v1/problems` stores a `pending` row in D1 (image in R2) — it appears
   on the map for everyone immediately, badged as pending
3. An admin reviews it at `/admin` (approve / reject / edit)

**Admin edits** to boulders/areas/subareas happen on the `/admin` page and are
live for all clients on their next refresh.

**Bundled seed:** the app ships a snapshot of `GET /v1/data`
(`react-native/assets/seed.json`) as a first-launch/offline fallback. Regenerate
with `node react-native/scripts/fetch-seed.mjs` before a release.

`cirque-data/` is archived — kept for history, no longer authoritative.
