# Cirque

## Data layer (ADR 0001)

All app data comes from `cirque-api` (`GET /v1/data`): zustand `dataStore`
is seeded synchronously from `assets/seed.json`, hydrated from a disk cache,
then refreshed over the network with ETag revalidation on launch. Topo images
load from R2 URLs via `expo-image` (disk-cached); the About screen can
prefetch all of them for offline use.

Env (`.env.local`): `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_KEY`,
`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.

## Smoke tests

Maestro covers app launch and navigation through the three primary tabs on
Android. With an emulator running and a release build installed, run:

```sh
maestro test .maestro
```

The same flow runs automatically for same-repository pull requests that change
the app. The CI build reads `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN` from a repository
secret so Mapbox can render the map and its local problem layers. Fork pull
requests skip this secret-dependent job; maintainers can run it after bringing
the change onto a repository branch. Problem data comes from the bundled seed,
so the assertions do not depend on the Cirque API.

## PR previews on iPhone

Comment `/preview` on a same-repository PR. The `pr-preview` EAS workflow fingerprints the dev variant, reuses a matching iOS development build or starts a new one, publishes the JS to the `pr-<number>` update branch, and replies with an "Open on iPhone" link. That link goes to `cirque-api`'s `/preview` page, which opens the update in Cirque Dev. When the PR changed native code, the page asks you to install the new build first.

## Release checklist

1. **Regenerate the bundled seed** so first-launch offline data is fresh:
2. `pnpm typecheck && pnpm lint && pnpm test`
3. Bump `version` in `app.config.ts`. App Store Connect rejects builds for a version it already approved.
4. Merge, then tag the commit and push the tag (`git tag v1.7.0 && git push origin v1.7.0`). The `build-and-submit` EAS workflow builds and submits both platforms.

## Troubleshooting

Clean reset steps:

1. `rm -rf .expo node_modules pnpm-lock.yaml ios android`
2. `pnpm install`
3. `pnpm ios:device`
4. `pnpm android:device`
5. `npx expo start --clear`
