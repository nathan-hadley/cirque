# Cirque

## Data layer (ADR 0001)

All app data comes from `cirque-api` (`GET /v1/data`): zustand `dataStore`
is seeded synchronously from `assets/seed.json`, hydrated from a disk cache,
then refreshed over the network with ETag revalidation on launch. Topo images
load from R2 URLs via `expo-image` (disk-cached); the About screen can
prefetch all of them for offline use.

Env (`.env.local`): `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_API_KEY`,
`EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`.

## Release checklist

1. **Regenerate the bundled seed** so first-launch offline data is fresh:
2. `pnpm typecheck && pnpm lint && pnpm test`
3. Build via EAS as usual.

## Troubleshooting

Clean reset steps:

1. `rm -rf .expo node_modules pnpm-lock.yaml ios android`
2. `pnpm install`
3. `pnpm ios:device`
4. `pnpm android:device`
5. `npx expo start --clear`
