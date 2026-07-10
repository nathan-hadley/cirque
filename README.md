# Cirque Leavenworth

- [About](About.md)
- [Contributing Guidelines](Contributing.md)
- [Privacy Policy](Privacy_Policy.md)

## Data Management

Problems and map documents live in the cloud (Cloudflare D1 + R2) and are
served to the app by [cirque-api](cirque-api/README.md) — see
[ADR 0001](docs/adr/0001-cloud-source-of-truth.md). The GeoJSON in
`cirque-data/` was the one-time bootstrap import and is no longer the source
of truth.

**Admin portal:** <https://cirque-api.nathan-hadley.workers.dev/admin>
(Cloudflare Access, one-time PIN) — review and approve/reject submissions,
edit problems, and edit the map documents.

### Problem workflow

1. Users submit problems (with a topo photo) through the app's Contribute
   screen. The submission lands as a `pending` row in D1 — rendered as a muted
   dot in the app — and the admin gets an email.
2. Approve, reject, or edit it in the admin portal.
3. The app picks up changes from `GET /v1/data` on next launch (ETag-cached,
   works offline from the last snapshot).

### Adding new topos

- Export from Photos app
  - JPEG quality: Medium
  - Size: Medium

### Bundled seed

`react-native/assets/seed.json` is the first-launch data snapshot. Refresh it
occasionally from production:

```sh
cd react-native && node scripts/fetch-seed.mjs
```
